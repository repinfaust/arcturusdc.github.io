'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function BikesPage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    displacementCc: '',
    notes: '',
  });

  const fetchBikes = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const bikesQuery = query(collection(db, 'apextwin_riders', user.uid, 'bikes'));
      const bikesSnap = await getDocs(bikesQuery);
      const bikesList = bikesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBikes(bikesList);
    } catch (err) {
      console.error('Error fetching bikes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      make: '',
      model: '',
      year: '',
      displacementCc: '',
      notes: '',
    });
    setEditingBike(null);
    setShowForm(false);
  };

  const handleEdit = (bike) => {
    setFormData({
      name: bike.name || '',
      make: bike.make || '',
      model: bike.model || '',
      year: bike.year?.toString() || '',
      displacementCc: bike.displacementCc?.toString() || '',
      notes: bike.notes || '',
    });
    setEditingBike(bike);
    setShowForm(true);
  };

  const handleDelete = async (bikeId) => {
    if (!confirm('Delete this bike? This cannot be undone.')) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'apextwin_riders', user.uid, 'bikes', bikeId));
      await fetchBikes();
    } catch (err) {
      console.error('Error deleting bike:', err);
      alert('Failed to delete bike');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);

    try {
      const bikeData = {
        name: formData.name.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year) : null,
        displacementCc: formData.displacementCc ? parseInt(formData.displacementCc) : null,
        notes: formData.notes.trim() || null,
      };

      if (editingBike) {
        await updateDoc(doc(db, 'apextwin_riders', user.uid, 'bikes', editingBike.id), {
          ...bikeData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'apextwin_riders', user.uid, 'bikes'), {
          ...bikeData,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      await fetchBikes();
    } catch (err) {
      console.error('Error saving bike:', err);
      alert('Failed to save bike');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="apex-h1 mb-1">Bikes</h1>
          <p className="text-apex-soft">Manage your bike profiles</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="apex-btn apex-btn-primary"
          >
            + Add Bike
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="apex-panel p-6">
          <h2 className="apex-h2 mb-4">{editingBike ? 'Edit Bike' : 'Add New Bike'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="apex-label block mb-1">Bike Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R6 Track Bike"
                  className="apex-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Make *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yamaha"
                  className="apex-input"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YZF-R6"
                  className="apex-input"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2020"
                  min="1980"
                  max="2030"
                  className="apex-input"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Displacement (cc)</label>
                <input
                  type="number"
                  placeholder="e.g. 600"
                  className="apex-input"
                  value={formData.displacementCc}
                  onChange={(e) => setFormData({ ...formData, displacementCc: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="apex-label block mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Any additional info about this bike..."
                className="apex-input resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="apex-btn apex-btn-primary"
              >
                {saving ? 'Saving...' : editingBike ? 'Update Bike' : 'Add Bike'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="apex-btn apex-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bikes List */}
      <div className="apex-panel">
        {loading ? (
          <div className="p-8 text-center text-apex-soft">Loading bikes...</div>
        ) : bikes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-apex-soft mb-4">No bikes added yet</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="apex-btn apex-btn-primary">
                Add your first bike
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-apex-stealth">
            {bikes.map((bike) => (
              <div key={bike.id} className="p-4 flex items-center justify-between hover:bg-apex-graphite/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-apex-white font-medium">{bike.name}</span>
                    {bike.year && (
                      <span className="text-apex-soft text-sm">{bike.year}</span>
                    )}
                  </div>
                  <div className="text-apex-soft text-sm">
                    {bike.make} {bike.model}
                    {bike.displacementCc && ` • ${bike.displacementCc}cc`}
                  </div>
                  {bike.notes && (
                    <div className="text-apex-soft text-xs mt-1 italic">{bike.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(bike)}
                    className="text-apex-soft hover:text-apex-white text-sm px-2 py-1 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(bike.id)}
                    className="text-apex-heat/70 hover:text-apex-heat text-sm px-2 py-1 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
