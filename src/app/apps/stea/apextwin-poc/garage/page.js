'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

export default function GaragePage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [editingDefaults, setEditingDefaults] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [settingsHistory, setSettingsHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    displacementCc: '',
    tyreSizeFront: '',
    tyreSizeRear: '',
    notes: '',
  });

  const [defaultsForm, setDefaultsForm] = useState({
    // Gearing
    frontSprocket: '',
    rearSprocket: '',
    chainLength: '',
    // Tyres
    tireBrandFront: '',
    tireCompoundFront: '',
    tirePressureFrontColdPsi: '',
    tireBrandRear: '',
    tireCompoundRear: '',
    tirePressureRearColdPsi: '',
    // Suspension
    forkCompClicksOut: '',
    forkRebClicksOut: '',
    shockCompClicksOut: '',
    shockRebClicksOut: '',
    // Electronics
    tractionControlLevel: '',
    engineMap: '',
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

  const fetchSettingsHistory = async (bikeId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const historyQuery = query(
        collection(db, 'apextwin_riders', user.uid, 'bikes', bikeId, 'settings_history'),
        orderBy('changedAt', 'desc'),
        limit(10)
      );
      const historySnap = await getDocs(historyQuery);
      const historyList = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSettingsHistory(historyList);
    } catch (err) {
      console.error('Error fetching history:', err);
      setSettingsHistory([]);
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
      tyreSizeFront: '',
      tyreSizeRear: '',
      notes: '',
    });
    setEditingBike(null);
    setShowForm(false);
  };

  const resetDefaultsForm = () => {
    setDefaultsForm({
      frontSprocket: '',
      rearSprocket: '',
      chainLength: '',
      tireBrandFront: '',
      tireCompoundFront: '',
      tirePressureFrontColdPsi: '',
      tireBrandRear: '',
      tireCompoundRear: '',
      tirePressureRearColdPsi: '',
      forkCompClicksOut: '',
      forkRebClicksOut: '',
      shockCompClicksOut: '',
      shockRebClicksOut: '',
      tractionControlLevel: '',
      engineMap: '',
    });
    setEditingDefaults(null);
  };

  const handleEdit = (bike) => {
    setFormData({
      name: bike.name || '',
      make: bike.make || '',
      model: bike.model || '',
      year: bike.year?.toString() || '',
      displacementCc: bike.displacementCc?.toString() || '',
      tyreSizeFront: bike.tyreSizeFront || '',
      tyreSizeRear: bike.tyreSizeRear || '',
      notes: bike.notes || '',
    });
    setEditingBike(bike);
    setShowForm(true);
  };

  const handleEditDefaults = (bike) => {
    const defaults = bike.defaultSettings || {};
    setDefaultsForm({
      frontSprocket: defaults.frontSprocket?.toString() || '',
      rearSprocket: defaults.rearSprocket?.toString() || '',
      chainLength: defaults.chainLength?.toString() || '',
      tireBrandFront: defaults.tireBrandFront || '',
      tireCompoundFront: defaults.tireCompoundFront || '',
      tirePressureFrontColdPsi: defaults.tirePressureFrontColdPsi?.toString() || '',
      tireBrandRear: defaults.tireBrandRear || '',
      tireCompoundRear: defaults.tireCompoundRear || '',
      tirePressureRearColdPsi: defaults.tirePressureRearColdPsi?.toString() || '',
      forkCompClicksOut: defaults.forkCompClicksOut?.toString() || '',
      forkRebClicksOut: defaults.forkRebClicksOut?.toString() || '',
      shockCompClicksOut: defaults.shockCompClicksOut?.toString() || '',
      shockRebClicksOut: defaults.shockRebClicksOut?.toString() || '',
      tractionControlLevel: defaults.tractionControlLevel || '',
      engineMap: defaults.engineMap || '',
    });
    setEditingDefaults(bike);
  };

  const handleViewHistory = async (bike) => {
    if (showHistory === bike.id) {
      setShowHistory(null);
      setSettingsHistory([]);
    } else {
      setShowHistory(bike.id);
      await fetchSettingsHistory(bike.id);
    }
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
        tyreSizeFront: formData.tyreSizeFront.trim() || null,
        tyreSizeRear: formData.tyreSizeRear.trim() || null,
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
          defaultSettings: {},
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

  const handleSaveDefaults = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !editingDefaults) return;

    setSaving(true);

    try {
      const newDefaults = {
        frontSprocket: defaultsForm.frontSprocket ? parseInt(defaultsForm.frontSprocket) : null,
        rearSprocket: defaultsForm.rearSprocket ? parseInt(defaultsForm.rearSprocket) : null,
        chainLength: defaultsForm.chainLength ? parseInt(defaultsForm.chainLength) : null,
        tireBrandFront: defaultsForm.tireBrandFront.trim() || null,
        tireCompoundFront: defaultsForm.tireCompoundFront.trim() || null,
        tirePressureFrontColdPsi: defaultsForm.tirePressureFrontColdPsi ? parseFloat(defaultsForm.tirePressureFrontColdPsi) : null,
        tireBrandRear: defaultsForm.tireBrandRear.trim() || null,
        tireCompoundRear: defaultsForm.tireCompoundRear.trim() || null,
        tirePressureRearColdPsi: defaultsForm.tirePressureRearColdPsi ? parseFloat(defaultsForm.tirePressureRearColdPsi) : null,
        forkCompClicksOut: defaultsForm.forkCompClicksOut ? parseInt(defaultsForm.forkCompClicksOut) : null,
        forkRebClicksOut: defaultsForm.forkRebClicksOut ? parseInt(defaultsForm.forkRebClicksOut) : null,
        shockCompClicksOut: defaultsForm.shockCompClicksOut ? parseInt(defaultsForm.shockCompClicksOut) : null,
        shockRebClicksOut: defaultsForm.shockRebClicksOut ? parseInt(defaultsForm.shockRebClicksOut) : null,
        tractionControlLevel: defaultsForm.tractionControlLevel.trim() || null,
        engineMap: defaultsForm.engineMap.trim() || null,
      };

      // Save history entry with previous settings
      const previousDefaults = editingDefaults.defaultSettings || {};
      await addDoc(
        collection(db, 'apextwin_riders', user.uid, 'bikes', editingDefaults.id, 'settings_history'),
        {
          previousSettings: previousDefaults,
          newSettings: newDefaults,
          changedAt: serverTimestamp(),
        }
      );

      // Update bike with new defaults
      await updateDoc(doc(db, 'apextwin_riders', user.uid, 'bikes', editingDefaults.id), {
        defaultSettings: newDefaults,
        defaultsUpdatedAt: serverTimestamp(),
      });

      resetDefaultsForm();
      await fetchBikes();
    } catch (err) {
      console.error('Error saving defaults:', err);
      alert('Failed to save default settings');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasDefaultSettings = (bike) => {
    const d = bike.defaultSettings;
    if (!d) return false;
    return Object.values(d).some(v => v !== null && v !== undefined && v !== '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="apex-h1 mb-1">Garage</h1>
          <p className="text-apex-soft">Manage your bikes and default settings</p>
        </div>
        {!showForm && !editingDefaults && (
          <button
            onClick={() => setShowForm(true)}
            className="apex-btn apex-btn-primary"
          >
            + Add Bike
          </button>
        )}
      </div>

      {/* Add/Edit Bike Form */}
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
              <div>
                <label className="apex-label block mb-1">Front Tyre Size</label>
                <input
                  type="text"
                  placeholder="e.g. 120/70-17"
                  className="apex-input"
                  value={formData.tyreSizeFront}
                  onChange={(e) => setFormData({ ...formData, tyreSizeFront: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Rear Tyre Size</label>
                <input
                  type="text"
                  placeholder="e.g. 180/55-17"
                  className="apex-input"
                  value={formData.tyreSizeRear}
                  onChange={(e) => setFormData({ ...formData, tyreSizeRear: e.target.value })}
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

      {/* Edit Default Settings Form */}
      {editingDefaults && (
        <div className="apex-panel p-6">
          <h2 className="apex-h2 mb-1">Default Settings</h2>
          <p className="text-apex-soft text-sm mb-4">{editingDefaults.make} {editingDefaults.model} - These settings will be used when selecting "Use Defaults" in session logging</p>

          <form onSubmit={handleSaveDefaults} className="space-y-6">
            {/* Gearing */}
            <div>
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Gearing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="apex-label block mb-1">Front Sprocket (T)</label>
                  <input type="number" min="10" max="20" placeholder="15" className="apex-input font-mono"
                    value={defaultsForm.frontSprocket}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, frontSprocket: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Rear Sprocket (T)</label>
                  <input type="number" min="30" max="60" placeholder="45" className="apex-input font-mono"
                    value={defaultsForm.rearSprocket}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, rearSprocket: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Chain Links</label>
                  <input type="number" min="100" max="140" placeholder="118" className="apex-input font-mono"
                    value={defaultsForm.chainLength}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, chainLength: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Tyres */}
            <div>
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Tyres</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-apex-soft text-xs uppercase">Front</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="apex-label block mb-1">Brand</label>
                      <input type="text" placeholder="e.g. Pirelli" className="apex-input"
                        value={defaultsForm.tireBrandFront}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tireBrandFront: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="apex-label block mb-1">Compound</label>
                      <input type="text" placeholder="e.g. SC1" className="apex-input"
                        value={defaultsForm.tireCompoundFront}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tireCompoundFront: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="apex-label block mb-1">Cold PSI</label>
                      <input type="number" step="0.1" placeholder="32.0" className="apex-input font-mono"
                        value={defaultsForm.tirePressureFrontColdPsi}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tirePressureFrontColdPsi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-apex-soft text-xs uppercase">Rear</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="apex-label block mb-1">Brand</label>
                      <input type="text" placeholder="e.g. Pirelli" className="apex-input"
                        value={defaultsForm.tireBrandRear}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tireBrandRear: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="apex-label block mb-1">Compound</label>
                      <input type="text" placeholder="e.g. SC0" className="apex-input"
                        value={defaultsForm.tireCompoundRear}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tireCompoundRear: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="apex-label block mb-1">Cold PSI</label>
                      <input type="number" step="0.1" placeholder="29.0" className="apex-input font-mono"
                        value={defaultsForm.tirePressureRearColdPsi}
                        onChange={(e) => setDefaultsForm({ ...defaultsForm, tirePressureRearColdPsi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suspension */}
            <div>
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Suspension</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="apex-label block mb-1">Fork Comp</label>
                  <input type="number" min="0" placeholder="Clicks out" className="apex-input font-mono"
                    value={defaultsForm.forkCompClicksOut}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, forkCompClicksOut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Fork Reb</label>
                  <input type="number" min="0" placeholder="Clicks out" className="apex-input font-mono"
                    value={defaultsForm.forkRebClicksOut}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, forkRebClicksOut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Shock Comp</label>
                  <input type="number" min="0" placeholder="Clicks out" className="apex-input font-mono"
                    value={defaultsForm.shockCompClicksOut}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, shockCompClicksOut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Shock Reb</label>
                  <input type="number" min="0" placeholder="Clicks out" className="apex-input font-mono"
                    value={defaultsForm.shockRebClicksOut}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, shockRebClicksOut: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Electronics */}
            <div>
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Electronics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="apex-label block mb-1">TC Level</label>
                  <input type="text" placeholder="e.g. 3" className="apex-input font-mono"
                    value={defaultsForm.tractionControlLevel}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, tractionControlLevel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Engine Map</label>
                  <input type="text" placeholder="e.g. A" className="apex-input font-mono"
                    value={defaultsForm.engineMap}
                    onChange={(e) => setDefaultsForm({ ...defaultsForm, engineMap: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="apex-btn apex-btn-primary">
                {saving ? 'Saving...' : 'Save Default Settings'}
              </button>
              <button type="button" onClick={resetDefaultsForm} className="apex-btn apex-btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bikes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="apex-panel p-8 text-center text-apex-soft">Loading bikes...</div>
        ) : bikes.length === 0 ? (
          <div className="apex-panel p-8 text-center">
            <p className="text-apex-soft mb-4">No bikes added yet</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="apex-btn apex-btn-primary">
                Add your first bike
              </button>
            )}
          </div>
        ) : (
          bikes.map((bike) => (
            <div key={bike.id} className="apex-panel">
              {/* Bike Header */}
              <div className="p-4 flex items-center justify-between border-b border-apex-stealth">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-apex-white font-medium text-lg">{bike.name}</span>
                    {bike.year && (
                      <span className="text-apex-soft text-sm">{bike.year}</span>
                    )}
                    {hasDefaultSettings(bike) && (
                      <span className="text-[10px] bg-apex-mint/20 text-apex-mint px-2 py-0.5 rounded">DEFAULTS SET</span>
                    )}
                  </div>
                  <div className="text-apex-soft text-sm">
                    {bike.make} {bike.model}
                    {bike.displacementCc && ` • ${bike.displacementCc}cc`}
                    {bike.tyreSizeFront && ` • ${bike.tyreSizeFront}/${bike.tyreSizeRear}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditDefaults(bike)}
                    className="text-apex-mint hover:text-apex-mint-tint text-sm px-3 py-1 border border-apex-mint/30 rounded transition-colors"
                  >
                    {hasDefaultSettings(bike) ? 'Edit Defaults' : 'Set Defaults'}
                  </button>
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

              {/* Default Settings Summary */}
              {hasDefaultSettings(bike) && (
                <div className="p-4 bg-apex-graphite/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {bike.defaultSettings.frontSprocket && (
                      <div>
                        <span className="text-apex-soft text-xs block">Gearing</span>
                        <span className="text-apex-white font-mono">
                          {bike.defaultSettings.frontSprocket}/{bike.defaultSettings.rearSprocket}
                        </span>
                      </div>
                    )}
                    {bike.defaultSettings.tireBrandFront && (
                      <div>
                        <span className="text-apex-soft text-xs block">Front Tyre</span>
                        <span className="text-apex-white">
                          {bike.defaultSettings.tireBrandFront} {bike.defaultSettings.tireCompoundFront}
                        </span>
                      </div>
                    )}
                    {bike.defaultSettings.forkCompClicksOut && (
                      <div>
                        <span className="text-apex-soft text-xs block">Fork</span>
                        <span className="text-apex-white font-mono">
                          C{bike.defaultSettings.forkCompClicksOut} R{bike.defaultSettings.forkRebClicksOut}
                        </span>
                      </div>
                    )}
                    {bike.defaultSettings.tractionControlLevel && (
                      <div>
                        <span className="text-apex-soft text-xs block">TC / Map</span>
                        <span className="text-apex-white font-mono">
                          {bike.defaultSettings.tractionControlLevel} / {bike.defaultSettings.engineMap || '--'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* History Toggle */}
                  <button
                    onClick={() => handleViewHistory(bike)}
                    className="mt-3 text-apex-soft hover:text-apex-white text-xs transition-colors"
                  >
                    {showHistory === bike.id ? '▼ Hide History' : '▶ View Settings History'}
                  </button>

                  {/* History List */}
                  {showHistory === bike.id && (
                    <div className="mt-3 space-y-2">
                      {settingsHistory.length === 0 ? (
                        <p className="text-apex-soft text-xs">No history yet</p>
                      ) : (
                        settingsHistory.map((entry) => (
                          <div key={entry.id} className="bg-apex-carbon/50 rounded p-3 text-xs">
                            <div className="text-apex-soft mb-1">{formatDate(entry.changedAt)}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {entry.newSettings.frontSprocket !== entry.previousSettings?.frontSprocket && (
                                <div>
                                  <span className="text-apex-soft">Gearing: </span>
                                  <span className="text-apex-heat line-through mr-1">
                                    {entry.previousSettings?.frontSprocket || '--'}/{entry.previousSettings?.rearSprocket || '--'}
                                  </span>
                                  <span className="text-apex-mint">
                                    {entry.newSettings.frontSprocket}/{entry.newSettings.rearSprocket}
                                  </span>
                                </div>
                              )}
                              {entry.newSettings.forkCompClicksOut !== entry.previousSettings?.forkCompClicksOut && (
                                <div>
                                  <span className="text-apex-soft">Fork Comp: </span>
                                  <span className="text-apex-heat line-through mr-1">{entry.previousSettings?.forkCompClicksOut || '--'}</span>
                                  <span className="text-apex-mint">{entry.newSettings.forkCompClicksOut}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {bike.notes && (
                <div className="px-4 py-2 text-apex-soft text-xs italic border-t border-apex-stealth">
                  {bike.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
