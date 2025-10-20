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
      // Datos profesionales opcionales
      jobTitle,
      experienceLevel,
      linkedinUrl
    } = body;

    console.log('📝 Registro de candidato iniciado:', { email, firstName, lastName });

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

    // 4. Obtener role_id de 'candidate'
    console.log('🔍 Buscando rol candidate...');
    const { data: roleData, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'candidate')
      .single();

    if (roleError || !roleData) {
      console.error('❌ Error obteniendo rol candidate:', roleError);
      throw new Error('No se pudo obtener el rol de candidato');
    }

    console.log('✅ Rol candidate encontrado:', roleData.id);

    // 5. Preparar metadata profesional (opcional)
    const metadata: any = {};
    if (jobTitle) metadata.job_title = jobTitle;
    if (experienceLevel) metadata.experience_level = experienceLevel;
    if (linkedinUrl) metadata.linkedin_url = linkedinUrl;

    console.log('💼 Metadata profesional:', metadata);

    // 6. Crear profile con metadata
    console.log('👥 Creando profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        role_id: roleData.id,
        is_active: true,
        metadata: Object.keys(metadata).length > 0 ? metadata : null
      });

    if (profileError) {
      console.error('❌ Error creando profile:', profileError);
      // Intentar eliminar el usuario de auth si falla el profile
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    console.log('✅ Profile creado');
    console.log('🎉 Registro de candidato completado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Cuenta de candidato creada exitosamente',
      userId: authData.user.id
    });

  } catch (error: any) {
    console.error('💥 Error en registro de candidato:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al crear la cuenta',
        details: error
      },
      { status: 500 }
    );
  }
}
