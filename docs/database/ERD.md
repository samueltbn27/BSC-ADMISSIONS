# Entity Relationship Diagram

`||` tepat satu, `o|` nol/satu, `o{` nol/banyak. Semua FK NOT NULL kecuali dokumen pada verifikasi tingkat aplikasi. Lihat [dictionary](DATA_DICTIONARY.md) untuk seluruh kolom dan batas nilai.

```mermaid
erDiagram
    roles ||--o{ users : role_code
    users ||--o| applicant_profiles : user_id_UNIQUE
    applicant_profiles ||--o{ applications : applicant_profile_id
    admission_periods ||--o{ applications : period_id
    majors ||--o{ applications : major_id
    applications ||--o{ application_documents : application_id
    document_types ||--o{ application_documents : document_type_id
    applications ||--o{ verification_records : application_id
    application_documents o|--o{ verification_records : document_id_and_application_id
    users ||--o{ verification_records : verified_by
    applications ||--o{ application_status_history : application_id
    users ||--o{ application_status_history : changed_by
    applications ||--o| selection_results : application_id_UNIQUE
    users ||--o{ selection_results : decided_by
    users ||--o{ audit_logs : actor_id

    roles {
        text code PK
        text name
    }
    users {
        uuid id PK
        text email UK
        text password_hash
        text role_code FK
        text account_status
    }
    applicant_profiles {
        uuid id PK
        uuid user_id FK,UK
        text full_name
        date birth_date
    }
    majors {
        smallint id PK
        text code UK
        text name UK
        boolean is_active
    }
    admission_periods {
        uuid id PK
        text name "UK composite with academic_year"
        text academic_year
        timestamptz opens_at
        timestamptz closes_at
        boolean is_active
    }
    applications {
        uuid id PK
        uuid applicant_profile_id FK "UK composite with period_id"
        uuid period_id FK
        smallint major_id FK
        text registration_number UK
        text status
        timestamptz submitted_at
        jsonb profile_snapshot
    }
    document_types {
        smallint id PK
        text code UK
        boolean is_required
        bigint max_size_bytes
        text_array allowed_mime_types
    }
    application_documents {
        uuid id PK "UK composite with application_id"
        uuid application_id FK "UK composite with document_type_id"
        smallint document_type_id FK
        text storage_key UK
        text verification_status
        integer revision
    }
    verification_records {
        uuid id PK
        uuid application_id FK
        uuid document_id FK "nullable composite FK with application_id"
        integer document_revision "nullable for application-level review"
        uuid verified_by FK
        text status
        text note
    }
    application_status_history {
        uuid id PK
        uuid application_id FK
        text previous_status "nullable initial event"
        text new_status
        uuid changed_by FK
    }
    selection_results {
        uuid id PK
        uuid application_id FK,UK
        text outcome
        timestamptz announcement_at
        timestamptz published_at "nullable until explicit publication"
        uuid decided_by FK
    }
    audit_logs {
        uuid id PK
        uuid actor_id FK
        text action
        text entity_type
        uuid entity_id "event target; not polymorphic FK"
        timestamptz occurred_at
    }
```

`audit_logs.entity_id` adalah target event generik, bukan FK lintas tabel; aktornya memakai FK dan target ditulis oleh fungsi setelah operasi target berhasil. Runtime tidak dapat menulis audit manual. `bsc_meta.migrations` adalah ledger tooling, di luar 12 entitas bisnis.

Constraint penting: satu profil per user; satu aplikasi per profil/periode; satu slot per aplikasi/jenis dokumen; FK komposit verifikasi mencegah dokumen lintas aplikasi; satu hasil per aplikasi; seluruh FK RESTRICT; daftar nilai status dibatasi CHECK. Aturan transisi dan otorisasi dijalankan fungsi SQL yang menjadi satu-satunya akses runtime.
