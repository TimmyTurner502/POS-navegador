
import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { XMarkIcon } from '../Icons';

interface BarcodeScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = new BrowserMultiFormatReader();

    useEffect(() => {
        if (videoRef.current) {
            codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                if (result) {
                    onScan(result.getText());
                }
                if (err && !(err instanceof NotFoundException)) {
                    console.error(err);
                }
            }).catch(err => console.error(err));
        }
        return () => {
            codeReader.reset();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl relative w-full max-w-md">
                <h3 className="text-lg font-bold mb-2">Escanear Código de Barras</h3>
                <video ref={videoRef} className="w-full h-auto border rounded-md"></video>
                <div className="absolute top-1/2 left-0 w-full border-t-2 border-red-500"></div>
                <button onClick={onClose} className="absolute top-2 right-2 p-1 bg-white/50 rounded-full text-gray-800 hover:bg-white">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default BarcodeScanner;
