import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente de Supabase con Service Role para insertar sin restricciones de RLS si fuera necesario,
// aunque la política pública permite insertar. Usaremos anon key si queremos respetar RLS,
// o service role si queremos asegurar que siempre funcione desde el backend.
// Dado que es un endpoint público, usaremos el cliente anon para simular un usuario anónimo,
// o mejor aún, service role para asegurar que la inserción ocurra independientemente de la sesión del navegador.
// Sin embargo, para contact requests, la política pública permite INSERT a 'anon'.
// Usaremos Service Role para mayor seguridad y evitar problemas de contexto.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validación básica
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (nombre, email, mensaje)' },
        { status: 400 }
      );
    }

    // Insertar en la base de datos
    // Mapeamos 'subject' a 'company' o lo incluimos en el mensaje si no hay campo específico.
    // La tabla tiene: name, email, phone, company, message, status.
    // El formulario tiene 'subject', que no está en la tabla explícitamente como columna separada.
    // Podemos guardar el subject al inicio del mensaje o usar el campo 'company' si aplica, 
    // pero 'subject' es más como el motivo.
    // Vamos a concatenar el asunto al mensaje para no perderlo.
    
    const fullMessage = `[Asunto: ${subject}]\n\n${message}`;

    const { data, error } = await supabase
      .from('contact_requests')
      .insert([
        {
          name,
          email,
          phone,
          message: fullMessage,
          status: 'new'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando contact request:', error);
      return NextResponse.json(
        { error: 'Error al guardar la solicitud' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Solicitud recibida correctamente', data },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error procesando solicitud de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
