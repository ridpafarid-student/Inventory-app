'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Pencil, Trash2, RefreshCw, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  // Auth state
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Inventory state
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ 
    nama: '', 
    satuan: 'unit', 
    stok: 0, 
    pcsPerBox: 10,
    boxQty: 0,
    pcsQty: 0
  })
  const [loading, setLoading] = useState(false)
  const [viewingItem, setViewingItem] = useState(null)

  // Check user authentication
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      setAuthLoading(false)
      fetchItems(user.id)
    }
  }

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Fetch data dari Supabase
  const fetchItems = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('barang')
      .select('*')
      .eq('user_id', userId)
      .order('nama', { ascending: true })
    
    if (error) {
      console.error('Error:', error)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const filteredItems = items.filter(item =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.nama || formData.nama.trim() === '') {
      alert('Nama Barang harus diisi!')
      return
    }
    
    if (!formData.satuan || formData.satuan.trim() === '') {
      alert('Jenis Satuan harus dipilih!')
      return
    }
    
    // Prepare data for database
    const dataToSave = {
      nama: formData.nama.trim(),
      satuan: formData.satuan.trim(),
      stok: Math.max(0, formData.stok || 0),
      pcsperbox: Math.max(1, formData.pcsPerBox || 10),
      user_id: user.id
    }
    
    console.log('Submitting data:', dataToSave)
    
    if (editingItem) {
      // Update
      const { error } = await supabase
        .from('barang')
        .update(dataToSave)
        .eq('id', editingItem.id)
      
      if (error) {
        console.error('Update Error:', error)
        alert('Gagal update: ' + (error?.message || JSON.stringify(error)))
      } else {
        console.log('Update success')
        alert('Barang berhasil diupdate!')
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('barang')
        .insert([dataToSave])
      
      if (error) {
        console.error('Insert Error:', error)
        alert('Gagal tambah: ' + (error?.message || JSON.stringify(error)))
      } else {
        console.log('Insert success')
        alert('Barang berhasil ditambahkan!')
      }
    }
    
    setShowModal(false)
    setFormData({ nama: '', satuan: 'unit', stok: 0, pcsPerBox: 10, boxQty: 0, pcsQty: 0 })
    setEditingItem(null)
    fetchItems(user.id)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    const pcsPerBox = item.pcsperbox || item.pcsPerBox || 10
    const totalStok = item.stok || 0
    const boxQty = Math.floor(totalStok / pcsPerBox)
    const pcsQty = totalStok % pcsPerBox
    
    setFormData({ 
      nama: item.nama, 
      satuan: item.satuan, 
      stok: totalStok, 
      pcsPerBox: pcsPerBox,
      boxQty: boxQty,
      pcsQty: pcsQty
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      const { error } = await supabase
        .from('barang')
        .delete()
        .eq('id', id)
      
      if (error) console.error('Error:', error)
      fetchItems(user.id)
    }
  }

  const handleView = (item) => {
    setViewingItem(item)
  }

  // Loading state saat cek auth
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        Loading...
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header Bar with Logout */}
      <div className={styles.headerBar}>
        <span>👤 {user?.email}</span>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div className={styles.mainContainer}>
        {/* Header */}
        <div className={styles.header}>
          <h1>📦 Penyimpanan Barang</h1>
          <button 
            className={styles.addButton}
            onClick={() => {
              setShowModal(true)
              setEditingItem(null)
              setFormData({ nama: '', satuan: 'unit', stok: 0, pcsPerBox: 10, boxQty: 0, pcsQty: 0 })
            }}
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.refreshButton} onClick={() => fetchItems(user.id)}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingBox}>
            ⏳ Loading...
          </div>
        )}

        {/* Items Table */}
        {!loading && filteredItems.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Jenis Satuan</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const pcsPerBox = item.pcsperbox || item.pcsPerBox || 10
                  const displayStok = item.satuan === 'box'
                    ? Math.floor(item.stok / pcsPerBox)
                    : item.stok
                  
                  return (
                    <tr key={item.id}>
                      <td>{item.nama}</td>
                      <td>
                        <span className={styles.badge}>
                          {item.satuan}
                        </span>
                      </td>
                      <td className={styles.bold}>{displayStok}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button onClick={() => handleView(item)} className={styles.viewButton}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleEdit(item)} className={styles.editButton}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className={styles.deleteButton}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className={styles.emptyState}>
              <div>📭</div>
              <div className={styles.emptyTitle}>Tidak ada barang ditemukan</div>
              <div className={styles.emptySubtitle}>
                Klik tombol "Tambah" untuk menambahkan barang baru
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{editingItem ? '✏️ Edit Barang' : '➕ Barang Baru'}</h2>

            <div className={styles.formGroup}>
              <label>Nama Barang</label>
              <input
                type="text"
                placeholder="Masukkan nama barang"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Jenis Satuan</label>
              <select
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
              >
                <option>unit</option>
                <option>pcs</option>
                <option>box</option>
              </select>
            </div>

            {/* Untuk satuan selain box, input stok langsung */}
            {formData.satuan !== 'box' && (
              <div className={styles.formGroup}>
                <label>Stok</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.stok}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setFormData({ ...formData, stok: Number.isNaN(v) ? 0 : Math.max(0, v) })
                  }}
                />
              </div>
            )}

            {/* Untuk satuan box, input box + pcs terpisah */}
            {formData.satuan === 'box' && (
              <>
                <div className={styles.grid2}>
                  <div>
                    <label>Jumlah Box</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.boxQty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        const newBoxQty = Number.isNaN(v) ? 0 : Math.max(0, v)
                        const newStok = (newBoxQty * formData.pcsPerBox) + formData.pcsQty
                        setFormData({ ...formData, boxQty: newBoxQty, stok: newStok })
                      }}
                    />
                  </div>
                  
                  <div>
                    <label>PCS per Box</label>
                    <input
                      type="number"
                      placeholder="10"
                      min="1"
                      value={formData.pcsPerBox}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        const newPcsPerBox = Number.isNaN(v) ? 10 : Math.max(1, v)
                        const newStok = (formData.boxQty * newPcsPerBox) + formData.pcsQty
                        setFormData({ ...formData, pcsPerBox: newPcsPerBox, stok: newStok })
                      }}
                    />
                  </div>
                </div>

                <div className={styles.totalBox}>
                  <label>TOTAL STOK</label>
                  <div className={styles.totalValue}>
                    {formData.stok} {}
                  </div>
                  <div className={styles.totalDesc}>
                    ({formData.boxQty} × {formData.pcsPerBox} pcs) {}
                  </div>
                </div>
              </>
            )}

            <div className={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} className={styles.cancelButton}>
                Batal
              </button>
              <button onClick={handleSubmit} className={styles.submitButton}>
                {editingItem ? 'Update' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal — Viewing Item */}
      {viewingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>📋 Detail Barang</h2>

            <div className={styles.detailGroup}>
              <label>NAMA BARANG</label>
              <div className={styles.detailValue}>{viewingItem.nama}</div>
            </div>

            <div className={styles.detailGroup}>
              <label>JENIS SATUAN</label>
              <div>
                <span className={styles.badge}>{viewingItem.satuan}</span>
              </div>
            </div>

            {viewingItem.satuan === 'box' ? (
              <>
                <div className={styles.detailGroup}>
                  <label>STOK DALAM BOX</label>
                  <div className={styles.detailNumber}>
                    {Math.floor(viewingItem.stok / (viewingItem.pcsperbox || viewingItem.pcsPerBox || 10))}
                  </div>
                </div>

                <div className={styles.detailGroup}>
                  <label>STOK TOTAL (DALAM PCS)</label>
                  <div className={styles.detailNumber}>
                    {viewingItem.stok}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.detailGroup}>
                <label>STOK</label>
                <div className={styles.detailNumber}>
                  {viewingItem.stok}
                </div>
              </div>
            )}

            <div className={styles.modalFooter}>
              <button onClick={() => setViewingItem(null)} className={styles.cancelButton}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}