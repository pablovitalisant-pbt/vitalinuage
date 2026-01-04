import React from 'react';
import { TalonarioCalibrator } from '../components/TalonarioCalibrator';

const TalonarioSettings: React.FC = () => {
    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-4 px-6 pt-4">Configuración de Talonario</h1>
            <TalonarioCalibrator />
        </div>
    );
};

export default TalonarioSettings;
