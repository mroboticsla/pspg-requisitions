import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parsePhoneCountryValue, getUnformattedPhone, formatFullPhoneNumber } from '@/lib/phoneUtils';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phoneCountry, 
      phoneNumber,
      // Datos de empresa (opcionales)
      companyName,
      companyLegalName,
      companyTaxId,
      companyIndustry,
      companyWebsite,
      companyPhone
    } = body;

    console.log('📝 Registro de partner iniciado:', { email, firstName, lastName });

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Formatear teléfono
    const { dialCode } = parsePhoneCountryValue(phoneCountry);
    const digits = getUnformattedPhone(phoneNumber);
    const fullPhone = `${dialCode}${digits}`;

    console.log('📞 Teléfono formateado:', fullPhone);

    // 1. Verificar si el email ya existe
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      console.log('❌ Email ya registrado:', email);
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    // 2. Verificar si el teléfono ya existe
    const { data: existingPhone } = await adminClient
      .from('profiles')
      .select('id')
      .eq('phone', fullPhone)
      .maybeSingle();

    if (existingPhone) {
      console.log('❌ Teléfono ya registrado:', fullPhone);
      return NextResponse.json(
        { error: 'El número de teléfono ya está registrado' },
        { status: 409 }
      );
    }

    // 3. Crear usuario en auth.users
    console.log('👤 Creando usuario en auth.users...');
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // true = email confirmado automáticamente (desarrollo)
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    console.log('✅ Usuario creado:', authData.user.id);

    // 4. Obtener role_id de 'partner'
    console.log('🔍 Buscando rol partner...');
    const { data: roleData, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'partner')
      .single();

    if (roleError || !roleData) {
      console.error('❌ Error obteniendo rol partner:', roleError);
      throw new Error('No se pudo obtener el rol de partner');
    }

    console.log('✅ Rol partner encontrado:', roleData.id);

    // 5. Crear profile
    console.log('👥 Creando profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        role_id: roleData.id,
        is_active: true
      });

    if (profileError) {
      console.error('❌ Error creando profile:', profileError);
      // Intentar eliminar el usuario de auth si falla el profile
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    console.log('✅ Profile creado');

    // 6. Si hay datos de empresa, crear empresa y asignar usuario
    if (companyName && companyName.trim()) {
      console.log('🏢 Creando empresa:', companyName);
      
      const { data: companyData, error: companyError } = await adminClient
        .from('companies')
        .insert({
          name: companyName,
          legal_name: companyLegalName || companyName,
          tax_id: companyTaxId || null,
          industry: companyIndustry || null,
          website: companyWebsite || null,
          contact_info: {
            phone: companyPhone || fullPhone,
            email: email
          },
          is_active: true
        })
        .select()
        .single();

      if (companyError) {
        console.error('❌ Error creando empresa:', companyError);
        // No fallar el registro si falla la empresa, el usuario puede agregarla después
        console.log('⚠️ Empresa no creada, pero el usuario fue registrado exitosamente');
      } else if (companyData) {
        console.log('✅ Empresa creada:', companyData.id);

        // 7. Asignar usuario a empresa
        console.log('🔗 Asignando usuario a empresa...');
        const { error: assignError } = await adminClient
          .from('company_users')
          .insert({
            company_id: companyData.id,
            user_id: authData.user.id,
            role_in_company: 'admin',
            is_active: true,
            assigned_by: authData.user.id
          });

        if (assignError) {
          console.error('❌ Error asignando usuario a empresa:', assignError);
          // No fallar el registro, el usuario puede ser asignado después
          console.log('⚠️ Asignación a empresa fallida, pero el usuario fue registrado');
        } else {
          console.log('✅ Usuario asignado a empresa');
        }
      }
    } else {
      console.log('ℹ️ No se proporcionaron datos de empresa');
    }

    console.log('🎉 Registro completado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Cuenta de partner creada exitosamente',
      userId: authData.user.id
    });

  } catch (error: any) {
    console.error('💥 Error en registro de partner:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al crear la cuenta',
        details: error
      },
      { status: 500 }
    );
  }
}
