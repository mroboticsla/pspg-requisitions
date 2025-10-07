'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { createCroppedCanvas, canvasToWebP } from '@/lib/imageUtils';
import { useToast } from '@/lib/useToast';

interface ImageCropModalProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  imageFile,
  onCropComplete,
  onCancel,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { error: toastError } = useToast();

  // Cargar la imagen cuando el componente se monta
  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(imageFile);

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageFile]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Inicializar el crop en el centro con aspecto 1:1
    const size = Math.min(width, height) * 0.9;
    const x = (width - size) / 2;
    const y = (height - size) / 2;

    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y,
    });
  }, []);

  const handleCropComplete = async () => {
    if (!imageRef.current || !completedCrop || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Crear canvas con la imagen recortada
      const canvas = createCroppedCanvas(imageRef.current, completedCrop, 512);

      // Convertir a WebP
      const blob = await canvasToWebP(canvas, 0.85);

      onCropComplete(blob);
    } catch (error) {
      console.error('Error al recortar imagen:', error);
      toastError('Hubo un error al procesar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Recortar Imagen de Perfil
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Ajusta el área de recorte para crear una imagen cuadrada
          </p>
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              className="max-w-full"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Imagen a recortar"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
                style={{ maxHeight: '60vh' }}
              />
            </ReactCrop>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            La imagen se redimensionará a 512 x 512 píxeles
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleCropComplete}
              disabled={!completedCrop || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Procesando...' : 'Aplicar Recorte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
