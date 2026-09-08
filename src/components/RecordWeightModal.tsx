import React, { useState } from 'react';
import { Modal } from './ui/Modal.tsx';
import { Button } from './ui/Button.tsx';
import { Input } from './ui/Input.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Scale } from 'lucide-react';

interface RecordWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecordWeightModal: React.FC<RecordWeightModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { apiFetch, refreshProfile, settings } = useAuth();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');
  const [showCircumference, setShowCircumference] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unit = settings?.weightUnit || 'kg';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) {
      setError('Please enter your weight');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/api/measurements', {
        method: 'POST',
        body: JSON.stringify({
          weight: parseFloat(weight),
          bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : null,
          chest: chest ? parseFloat(chest) : null,
          waist: waist ? parseFloat(waist) : null,
          hips: hips ? parseFloat(hips) : null,
          arms: arms ? parseFloat(arms) : null,
          thighs: thighs ? parseFloat(thighs) : null,
          recordedAt: new Date().toISOString(),
        }),
      });

      await refreshProfile();
      setWeight('');
      setBodyFat('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save measurement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Weight & Body Measurements">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Current Weight (${unit})`}
            type="number"
            step="0.1"
            placeholder={`e.g. 74.5`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Body Fat % (optional)"
            type="number"
            step="0.1"
            placeholder="e.g. 15.2"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowCircumference(!showCircumference)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {showCircumference ? '− Hide body circumferences' : '+ Add body circumferences (chest, waist, hips)'}
          </button>
        </div>

        {showCircumference && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Input
              label="Chest (cm)"
              type="number"
              step="0.5"
              placeholder="e.g. 98"
              value={chest}
              onChange={(e) => setChest(e.target.value)}
            />
            <Input
              label="Waist (cm)"
              type="number"
              step="0.5"
              placeholder="e.g. 82"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
            <Input
              label="Hips (cm)"
              type="number"
              step="0.5"
              placeholder="e.g. 96"
              value={hips}
              onChange={(e) => setHips(e.target.value)}
            />
            <Input
              label="Arms (cm)"
              type="number"
              step="0.5"
              placeholder="e.g. 36"
              value={arms}
              onChange={(e) => setArms(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <Scale className="w-4 h-4 mr-1.5" />
            Save Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
