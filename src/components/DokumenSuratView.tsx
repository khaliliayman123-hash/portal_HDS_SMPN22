/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  Printer, 
  Upload, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Eye, 
  AlertCircle,
  X,
  FileDown
} from 'lucide-react';
import { DatabaseState, User, UserRole, Surat, Dokumen } from '../types';

interface DokumenSuratViewProps {
  db: DatabaseState;
  currentUser: User;
  onSaveSurat: (s: Surat, isNew: boolean) => Promise<boolean>;
  onDeleteSurat: (id: string) => Promise<boolean>;
  onSaveDokumen: (d: Dokumen, isNew: boolean) => Promise<boolean>;
  onDeleteDokumen: (id: string) => Promise<boolean>;
}

export default function DokumenSuratView({
  db,
  currentUser,
  onSaveSurat,
  onDeleteSurat,
  onSaveDokumen,
  onDeleteDokumen
}: DokumenSuratViewProps) {

  const canModify = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.GURU_BK;

  // Tabs layout
  const [activeTab, setActiveTab] = useState<'surat' | 'dokumen'>('surat');

  // SURAT STATES
  const [selectedStudentId, setSelectedStudentId] = useState<string>(db.siswa[0]?.id || '');
  const [letterType, setLetterType] = useState<'Surat Panggilan' | 'Surat Kontrak Perilaku' | 'Surat Home Visit' | 'Surat Rujukan'>('Surat Panggilan');
  const [letterNo, setLetterNo] = useState<string>(`045/BK-SMP/${new Date().getFullYear()}`);
  const [letterSubject, setLetterSubject] = useState<string>('Panggilan Orang Tua Terkait Kedisiplinan Siswa');
  const [letterBody, setLetterBody] = useState<string>(
    'Mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid ke Ruang Bimbingan Konseling sekolah pada hari Senin mendatang guna berkoordinasi membicarakan perkembangan akademik dan ketertiban putra/putri Bapak/Ibu.'
  );

  // Active viewing/printing letter template
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);

  // DOKUMEN STATES
  const [selectedDocStudentId, setSelectedDocStudentId] = useState<string>(db.siswa[0]?.id || '');
  const [docType, setDocType] = useState<'KK' | 'Akta' | 'Raport' | 'Sertifikat' | 'Foto Rumah' | 'Lainnya'>('KK');
  const [fileNameInput, setFileNameInput] = useState<string>('');

  // Delete confirmation modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'surat' | 'dokumen' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }

    const newSurat: Surat = {
      id: `sur-${Date.now()}`,
      siswaId: selectedStudentId,
      nomorSurat: letterNo,
      tanggal: new Date().toISOString().split('T')[0],
      jenisSurat: letterType,
      perihal: letterSubject,
      isiSurat: letterBody
    };

    const success = await onSaveSurat(newSurat, true);
    if (success) {
      setPreviewLetter(newSurat);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocStudentId || !fileNameInput) {
      alert('Isi nama file dokumen terlebih dahulu!');
      return;
    }

    const newDoc: Dokumen = {
      id: `dok-${Date.now()}`,
      siswaId: selectedDocStudentId,
      jenisDokumen: docType,
      namaFile: fileNameInput,
      tanggalUpload: new Date().toISOString().split('T')[0]
    };

    const success = await onSaveDokumen(newDoc, true);
    if (success) {
      setFileNameInput('');
    }
  };

  const handleDeleteLetter = (id: string) => {
    if (!canModify) return;
    setDeleteConfirmId(id);
    setDeleteConfirmType('surat');
  };

  const handleDeleteDoc = (id: string) => {
    if (!canModify) return;
    setDeleteConfirmId(id);
    setDeleteConfirmType('dokumen');
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !deleteConfirmType) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmType === 'surat') {
        const success = await onDeleteSurat(deleteConfirmId);
        if (success && previewLetter?.id === deleteConfirmId) {
          setPreviewLetter(null);
        }
      } else if (deleteConfirmType === 'dokumen') {
        await onDeleteDokumen(deleteConfirmId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    }
  };

  const triggerPrint = () => {
    const element = document.getElementById('printable-letter-container');
    if (!element) {
      alert('Elemen surat tidak ditemukan.');
      return;
    }

    // Obtain or create the persistent print container in the main DOM tree
    let printSection = document.getElementById('print-section');
    if (!printSection) {
      printSection = document.createElement('div');
      printSection.id = 'print-section';
      document.body.appendChild(printSection);
    }

    // Populate with high-fidelity letter HTML
    printSection.innerHTML = `
      <div class="p-10 max-w-4xl mx-auto text-slate-800 bg-white min-h-screen font-serif" style="font-family: 'Georgia', serif; font-size: 14px; line-height: 1.6;">
        ${element.innerHTML}
      </div>
    `;

    // Trigger Print
    setTimeout(() => {
      window.print();
      
      // Cleanup hook
      const cleanup = () => {
        if (printSection) {
          printSection.innerHTML = '';
        }
      };

      // Set timeout fallback & standard listener
      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 1500);
    }, 50);
  };

  return (
    <div id="dokumen-surat-panel" className="space-y-6">
      
      {/* Navigation tab switch */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm w-fit text-xs font-semibold text-slate-500">
        <button 
          onClick={() => setActiveTab('surat')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${activeTab === 'surat' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50'}`}
        >
          <Mail size={14} /> Generator Surat BK
        </button>
        <button 
          onClick={() => setActiveTab('dokumen')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${activeTab === 'dokumen' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50'}`}
        >
          <Upload size={14} /> Arsip Dokumen Siswa
        </button>
      </div>

      {activeTab === 'surat' ? (
        /* ==================== A. GENERATOR SURAT SYSTEM ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Columns: Parameters Form & History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                Parameter Generator Surat
              </h3>
              
              <form onSubmit={handleCreateLetter} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Siswa Terkait</label>
                  <select 
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="p-2.5 border border-slate-200 bg-white rounded-xl w-full focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {db.siswa.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({db.kelas.find(k => k.id === s.kelasId)?.namaKelas || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Surat</label>
                    <select 
                      value={letterType}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        setLetterType(type);
                        // Populate placeholder based on type
                        if (type === 'Surat Panggilan') {
                          setLetterSubject('Panggilan Orang Tua Terkait Kedisiplinan Siswa');
                          setLetterBody('Mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid ke Ruang Bimbingan Konseling sekolah pada hari Senin mendatang guna membicarakan perkembangan kedisiplinan dan pembinaan khusus putra/putri Bapak/Ibu.');
                        } else if (type === 'Surat Kontrak Perilaku') {
                          setLetterSubject('Surat Kontrak Perilaku Tertib Siswa');
                          setLetterBody('Menyatakan bahwa saya (Siswa) berjanji tidak akan mengulangi kesalahan tata tertib sekolah, menaati semua peraturan, dan bersedia menerima sanksi dikeluarkan bila mengulangi kesalahan serupa.');
                        } else if (type === 'Surat Home Visit') {
                          setLetterSubject('Surat Tugas Kunjungan Rumah (Home Visit)');
                          setLetterBody('Menugaskan guru bimbingan konseling di bawah ini untuk mengadakan kunjungan rumah ke kediaman siswa bersangkutan guna berkoordinasi, melakukan investigasi, serta mengidentifikasi faktor lingkungan rumah.');
                        } else {
                          setLetterSubject('Surat Rujukan Konseling / Penanganan Ahli (Referral)');
                          setLetterBody('Dengan ini merujuk siswa di atas kepada lembaga konsultasi psikologi / psikolog profesional eksternal karena memerlukan penanganan diagnostik klinis yang lebih mendalam.');
                        }
                      }}
                      className="p-2.5 border border-slate-200 bg-white rounded-xl w-full"
                    >
                      <option value="Surat Panggilan">Surat Panggilan</option>
                      <option value="Surat Kontrak Perilaku">Surat Kontrak Perilaku</option>
                      <option value="Surat Home Visit">Surat Home Visit</option>
                      <option value="Surat Rujukan">Surat Rujukan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nomor Surat</label>
                    <input 
                      type="text" 
                      value={letterNo}
                      onChange={(e) => setLetterNo(e.target.value)}
                      className="p-2.5 border border-slate-200 rounded-xl w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Perihal / Subject</label>
                  <input 
                    type="text" 
                    value={letterSubject}
                    onChange={(e) => setLetterSubject(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-xl w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Isi Surat Resmi (Body)</label>
                  <textarea 
                    rows={4} 
                    value={letterBody}
                    onChange={(e) => setLetterBody(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-xl w-full leading-relaxed"
                    required
                  />
                </div>

                {canModify && (
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Printer size={14} /> Buat & Tampilkan Surat
                  </button>
                )}
              </form>
            </div>

            {/* Archival list history */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h4 className="font-bold text-slate-800">Arsip Surat Terbit ({db.surat.length})</h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {db.surat.map(s => {
                  const siswa = db.siswa.find(item => item.id === s.siswaId);
                  return (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700">{s.jenisSurat}</p>
                        <p className="text-[10px] text-slate-400">Siswa: {siswa?.nama} | No: {s.nomorSurat}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setPreviewLetter(s)}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700"
                          title="Pratinjau Cetak"
                        >
                          <Eye size={12} />
                        </button>
                        {canModify && (
                          <button 
                            onClick={() => handleDeleteLetter(s.id)}
                            className="p-1 bg-white hover:bg-rose-50 border border-slate-200 rounded text-rose-500"
                            title="Hapus Arsip"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Columns: Printable Kop Surat View Frame */}
          <div className="lg:col-span-3">
            {previewLetter ? (() => {
              const siswa = db.siswa.find(item => item.id === previewLetter.siswaId);
              const kelas = db.kelas.find(k => k.id === siswa?.kelasId);
              const ot = db.orangTua.find(o => o.id === siswa?.id);
              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg space-y-6">
                  {/* Action buttons */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl -mt-2 -mx-2 mb-4 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400">PRATINJAU KOP SURAT RESMI</span>
                    <button 
                      onClick={triggerPrint}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer size={14} /> Cetak Sekarang (PDF)
                    </button>
                  </div>

                  {/* HIGH-FIDELITY printable frame */}
                  <div id="printable-letter-container" className="p-8 border border-slate-200 bg-white shadow-sm font-serif max-w-xl mx-auto rounded-md text-[12px] text-slate-800 space-y-4">
                    
                    {/* Official Kop Surat Header */}
                    <div className="text-center border-b-4 border-double border-black pb-2 space-y-0.5">
                      <p className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KOTA TANGERANG SELATAN</p>
                      <p className="font-black text-base uppercase">UPTD SMPN 22 KOTA TANGERANG SELATAN</p>
                      <p className="text-[10px] font-medium italic">Jl. Perumahan Pamulang Permai I, Pamulang Barat, Kec. Pamulang | Email: info@smpn22kotatangsel.sch.id</p>
                    </div>

                    {/* Date and No */}
                    <div className="flex justify-between">
                      <div>
                        <p>Nomor : {previewLetter.nomorSurat}</p>
                        <p>Lampiran: -</p>
                        <p>Perihal : <u>{previewLetter.perihal}</u></p>
                      </div>
                      <p className="text-right">Jakarta, {previewLetter.tanggal}</p>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-1">
                      <p>Kepada Yth,</p>
                      <p className="font-bold">Bapak/Ibu Orang Tua / Wali Murid dari {siswa?.nama}</p>
                      <p>Di Tempat</p>
                    </div>

                    {/* Greeting */}
                    <p className="leading-relaxed">Dengan hormat,</p>

                    {/* Body content */}
                    <p className="indent-8 leading-relaxed text-justify">
                      Sehubungan dengan program bimbingan perkembangan karakter peserta didik UPTD SMPN 22 Kota Tangerang Selatan, kami mengundang Bapak/Ibu sekalian untuk berkoordinasi. {previewLetter.isiSurat}
                    </p>

                    {/* Student particulars if applicable */}
                    <div className="pl-8 space-y-1">
                      <table className="w-full text-left">
                        <tbody>
                          <tr>
                            <td className="w-28 font-semibold">Nama Siswa</td>
                            <td>: {siswa?.nama}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold">NIS / NISN</td>
                            <td>: {siswa?.nis} / {siswa?.nisn}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold">Kelas</td>
                            <td>: {kelas?.namaKelas || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Closing */}
                    <p className="indent-8 leading-relaxed text-justify">
                      Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, kerja sama, dan kehadiran Bapak/Ibu, kami mengucapkan banyak terima kasih.
                    </p>

                    {/* Signature Panel */}
                    <div className="pt-6 grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-12">
                        <p>Mengetahui,<br/>Kepala Sekolah</p>
                        <div>
                          <p className="font-bold underline">Salim, S.Pd., M.Hum.</p>
                          <p className="text-[10px] text-slate-500">NIP. 700412 199903 1 004</p>
                        </div>
                      </div>
                      <div className="space-y-12">
                        <p>Hormat kami,<br/>Guru Bimbingan Konseling</p>
                        <div>
                          <p className="font-bold underline">Sulaiman, S.Psi., MM</p>
                          <p className="text-[10px] text-slate-500">NIP. 198209202022211009</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })() : (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 space-y-2 h-full flex flex-col items-center justify-center">
                <Mail size={48} className="text-slate-200 stroke-1" />
                <p className="font-bold text-xs text-slate-600">Arsip Kop Surat Kosong</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Isi form di kiri lalu submit atau pilih arsip surat di bawahnya untuk memuat cetak formal.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ==================== B. FILE UPLOADS / KK / AKTA ARSIP ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Uploader Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Upload size={16} className="text-emerald-600" />
              Unggah Dokumen Baru
            </h3>

            <form onSubmit={handleDocUpload} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Siswa</label>
                <select 
                  value={selectedDocStudentId}
                  onChange={(e) => setSelectedDocStudentId(e.target.value)}
                  className="p-2.5 border border-slate-200 bg-white rounded-xl w-full"
                  required
                >
                  {db.siswa.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Kategori Dokumen</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="p-2.5 border border-slate-200 bg-white rounded-xl w-full"
                >
                  <option value="KK">Kartu Keluarga (KK)</option>
                  <option value="Akta">Akta Kelahiran</option>
                  <option value="Raport">Buku Raport</option>
                  <option value="Sertifikat">Sertifikat Piagam</option>
                  <option value="Foto Rumah">Foto Kondisi Rumah</option>
                  <option value="Lainnya">Dokumen Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama File Fisik</label>
                <input 
                  type="text" 
                  placeholder="e.g., kk_aditya_terbaru.pdf"
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl w-full"
                  required
                />
              </div>

              {canModify && (
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Upload size={14} /> Registrasikan Dokumen
                </button>
              )}
            </form>
          </div>

          {/* Docs Table Directory */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Jenis Dokumen</th>
                  <th className="py-3 px-4">Nama Arsip File</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {db.dokumen && db.dokumen.length > 0 ? (
                  db.dokumen.map(d => {
                    const siswa = db.siswa.find(s => s.id === d.siswaId);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3 px-4 font-bold text-slate-800">{siswa?.nama || 'Siswa'}</td>
                        <td className="py-3 px-4">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">{d.jenisDokumen}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{d.namaFile}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                            {canModify && (
                              <button 
                                onClick={() => handleDeleteDoc(d.id)}
                                className="p-1 hover:bg-rose-50 rounded text-rose-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada dokumen terarsip.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteConfirmType === 'surat' ? 'arsip surat resmi' : 'dokumen fisik'} ini secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmType(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
