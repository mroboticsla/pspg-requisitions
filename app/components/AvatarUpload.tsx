'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { validateImageFile, isSquareImage, resizeAndConvertToWebP } from '@/lib/imageUtils';
import ImageCropModal from './ImageCropModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '@/lib/useToast';

interface AvatarUploadProps {
  user: { id: string; email?: string | null };
  currentAvatarUrl?: string | null;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  disabled?: boolean;
}

export default function AvatarUpload({ user, currentAvatarUrl, onAvatarUpdate, disabled = false }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  // Sincronizar el estado local cuando cambia la prop currentAvatarUrl
  React.useEffect(() => {
    setAvatarUrl(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toastError(validation.error || 'Archivo de imagen no válido');
      return;
    }

    // Verificar si la imagen es cuadrada
    try {
      const isSquare = await isSquareImage(file);
      
      if (isSquare) {
        // Si es cuadrada, procesar directamente
        await processAndUploadImage(file);
      } else {
        // Si no es cuadrada, mostrar modal de recorte
        setSelectedFile(file);
        setShowCropModal(true);
      }
    } catch (error) {
      console.error('Error al verificar imagen:', error);
      toastError('Hubo un error al procesar la imagen. Por favor, intenta de nuevo.');
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    setSelectedFile(null);
    await uploadImageBlob(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processAndUploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Redimensionar y convertir a WebP
      const processedBlob = await resizeAndConvertToWebP(file, 512);
      
      await uploadImageBlob(processedBlob);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      toastError('Hubo un error al procesar la imagen. Por favor, intenta de nuevo.');
      setUploading(false);
    }
  };

  const uploadImageBlob = async (blob: Blob) => {
    if (disabled) return;
    try {
      setUploading(true);

      // Construir la ruta del archivo en el bucket
      const filePath = `user-${user.id}/avatar.webp`;

      console.log('📤 Subiendo imagen:', {
        filePath,
        size: blob.size,
        type: blob.type
      });

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true, // Sobrescribir si ya existe
        });

      if (uploadError) {
        console.error('❌ Error de subida:', uploadError);
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
      }

      console.log('✅ Imagen subida correctamente');

      // Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      console.log('🔗 URL pública generada:', newAvatarUrl);

      // Verificar que la URL es accesible agregando un timestamp para evitar caché
      const urlWithTimestamp = `${newAvatarUrl}?t=${Date.now()}`;

      // Primero intentar actualizar, si no existe entonces insertar
      const { data: existingData } = await supabase
        .from('user_metadata')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📋 Verificando user_metadata existente:', {
        userId: user.id,
        exists: !!existingData,
        existingData
      });

      let metadataError;
      
      if (existingData) {
        // Actualizar registro existente
        console.log('🔄 Actualizando registro existente...');
        const { error } = await supabase
          .from('user_metadata')
          .update({ avatar_url: newAvatarUrl })
          .eq('user_id', user.id);
        metadataError = error;
      } else {
        // Insertar nuevo registro
        console.log('➕ Insertando nuevo registro...');
        const { error } = await supabase
          .from('user_metadata')
          .insert({ 
            user_id: user.id,
            avatar_url: newAvatarUrl 
          });
        metadataError = error;
      }

      if (metadataError) {
        console.error('❌ Error al actualizar metadata:', metadataError);
        throw new Error(`Error al guardar avatar: ${metadataError.message}`);
      }

      console.log('✅ Avatar guardado correctamente en user_metadata');

      // Actualizar estado local con timestamp
      setAvatarUrl(urlWithTimestamp);

      // Notificar al componente padre
      if (onAvatarUpdate) {
        onAvatarUpdate(urlWithTimestamp);
      }

      success('¡Foto de perfil actualizada con éxito!');
    } catch (error: any) {
      console.error('Error al subir avatar:', error);
      toastError(error.message || 'Hubo un error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (disabled) return;
    try {
      setUploading(true);
      setShowDeleteConfirm(false);

      const filePath = `user-${user.id}/avatar.webp`;

      // Eliminar del storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Error al eliminar del storage:', deleteError);
        // No lanzamos error aquí porque el archivo podría no existir
      }

      // Actualizar user_metadata
      const { error: updateError } = await supabase
        .from('user_metadata')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Actualizar estados locales
      setAvatarUrl(null);
      
      // Notificar al componente padre para actualizar el estado global
      if (onAvatarUpdate) {
        onAvatarUpdate(''); // String vacío para indicar eliminación
      }

      success('Foto de perfil eliminada con éxito.');
    } catch (error: any) {
      console.error('Error al eliminar avatar:', error);
      toastError(error.message || 'Hubo un error al eliminar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Generar iniciales del usuario para el avatar por defecto
  const getUserInitials = () => {
    const email = user.email || '';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative group ${disabled ? 'opacity-60' : ''}`} aria-disabled={disabled}>
      {/* Avatar Preview con Overlay de Edición */}
      <div className="relative inline-block">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            {/* Avatar genérico SVG */}
            <svg 
              className="w-full h-full text-indigo-300" 
              viewBox="0 0 100 100" 
              fill="currentColor"
            >
              {/* Cabeza */}
              <circle cx="50" cy="35" r="18" />
              {/* Cuerpo/Hombros */}
              <path d="M 20 85 Q 20 60 50 60 Q 80 60 80 85 L 80 100 L 20 100 Z" />
            </svg>
          </div>
        )}
        
        {/* Overlay de hover con ícono de editar */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        )}
        
        {!uploading && !disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
            title={avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            type="button"
          >
            <div className="flex flex-col items-center gap-1">
              <svg 
                className="w-10 h-10 text-white drop-shadow-lg" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span className="text-white text-xs font-medium drop-shadow-lg">
                {avatarUrl ? 'Cambiar' : 'Subir'}
              </span>
            </div>
          </button>
        )}

        {/* Botón de eliminar (solo si hay avatar) */}
        {avatarUrl && !uploading && !disabled && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            type="button"
            className="absolute top-0 right-0 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
            title="Eliminar foto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
        id="avatar-upload"
      />

      {/* Crop Modal */}
      {showCropModal && selectedFile && (
        <ImageCropModal
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Confirm Delete Modal */}
      {!disabled && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Eliminar foto de perfil"
          message="¿Estás seguro de que deseas eliminar tu foto de perfil? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleRemoveAvatar}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
