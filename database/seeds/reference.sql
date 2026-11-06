-- Reference data only. No credentials, users, active periods or selection results.
INSERT INTO bsc.roles(code, name) VALUES
    ('applicant', 'Calon Siswa'), ('committee', 'Panitia'), ('admin', 'Admin')
ON CONFLICT (code) DO NOTHING;

-- Canonical TJKT from the supplied requirement; school naming awaits BA approval.
INSERT INTO bsc.majors(code, name, description) VALUES
    ('TJKT', 'Teknik Jaringan Komputer dan Telekomunikasi', 'Program keahlian TJKT'),
    ('PPLG', 'Pengembangan Perangkat Lunak dan Gim', 'Program keahlian PPLG'),
    ('ANIMASI', 'Animasi', 'Program keahlian Animasi'),
    ('MPLB', 'Manajemen Perkantoran dan Layanan Bisnis', 'Program keahlian MPLB'),
    ('OTOMOTIF', 'Otomotif', 'Program keahlian Otomotif')
ON CONFLICT (code) DO NOTHING;

-- A diploma OR graduation letter is represented by one document type.
INSERT INTO bsc.document_types(code, name, is_required, allowed_mime_types) VALUES
    ('graduation_proof', 'Ijazah atau Surat Keterangan Lulus', true, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('family_card', 'Kartu Keluarga', true, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('photo', 'Pas foto', true, ARRAY['image/jpeg', 'image/png']),
    ('supporting', 'Dokumen pendukung lain', false, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (code) DO NOTHING;
