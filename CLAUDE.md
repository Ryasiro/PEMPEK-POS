# test

Proyek ini dikerjakan via **ngodingpakeai** workflow.

## Workflow
1. Baca PRD via `npx ngodingpakeai plan get <projectId>`
2. Ambil task via `npx ngodingpakeai task next <projectId>`
3. Minta konteks fokus: `npx ngodingpakeai task context <projectId> <taskId>`
4. Kerjakan SATU task sampai selesai. JANGAN sentuh task lain.
5. Tandai selesai: `npx ngodingpakeai task complete <projectId> <taskId>`
6. Ulang dari langkah 2.

## Aturan
- Satu task sekali jalan. Fokus penuh.
- Kalau ke-block: `task fail <id> "alasan"` lalu lanjut `task next`
- Setiap ganti fase: STOP. User harus verifikasi dulu.
