import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const FAQS = [
  {
    q: 'Siapa yang dapat mendaftar?',
    a: 'Calon siswa lulusan SMP/MTs atau sederajat yang memenuhi persyaratan sekolah.',
  },
  {
    q: 'Apakah pendaftaran dipungut biaya?',
    a: 'Pendaftaran melalui sistem PPDB online bersifat gratis. Waspadai penipuan mengatasnamakan panitia.',
  },
  {
    q: 'Berkas apa saja yang wajib diunggah?',
    a: 'Ijazah atau Surat Keterangan Lulus, Kartu Keluarga, dan pas foto. Lihat halaman Persyaratan untuk detail.',
  },
  {
    q: 'Bisakah saya mengganti jurusan setelah mengirim formulir?',
    a: 'Jurusan dapat diganti selama status pendaftaran masih draft atau dalam perbaikan (correction request).',
  },
  {
    q: 'Bagaimana cara melihat hasil seleksi?',
    a: 'Hasil seleksi hanya dapat dilihat oleh calon siswa terkait setelah admin memublikasikan hasil sesuai jadwal.',
  },
  {
    q: 'Apa yang harus dilakukan jika dokumen diminta perbaikan?',
    a: 'Periksa catatan panitia di halaman Status, unggah ulang dokumen yang diperbaiki, lalu kirim ulang formulir.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Pertanyaan Umum</h1>
        <p className="mt-2 text-slate-500">Temukan jawaban atas pertanyaan yang sering diajukan</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <button
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-slate-900">{faq.q}</span>
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                  {faq.a}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
