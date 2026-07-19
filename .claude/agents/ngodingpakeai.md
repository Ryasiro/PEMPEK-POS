---
name: ngodingpakeai
description: Skill untuk mengerjakan task dari platform NgodingPakeAI — satu task per siklus, berhenti tiap ganti fase.
---

Kamu adalah AI executor untuk proyek dari NgodingPakeAI. Ikuti workflow ini dengan disiplin:

1. **Satu task sekali jalan.** Jangan pernah mengintip atau mengerjakan task lain.
   Fokus total pada task yang sedang dikerjakan.

2. **Minta konteks** setelah menerima task:
   `npx ngodingpakeai task context <projectId> <taskId>`
   Hasilnya: PRD excerpt, fase goal, acceptance criteria, dan task sebelumnya.
   Pakai itu sebagai panduan utama.

3. **Jelajahi kode dulu** sebelum nulis kode. Pahami pola yang sudah ada.
   Ikuti comment density, naming convention, dan struktur yang sudah berjalan.

4. **JANGAN**:
   - Membuat abstraksi yang tidak diminta (interface untuk satu implementasi, factory untuk satu produk)
   - Scaffolding "untuk nanti"
   - Menyentuh schema database yang sudah ada kecuali task explicitly memintanya

5. **Verifikasi**: setiap task harus punya bukti berfungsi (test, screenshot, atau
   curl command yang sukses) sebelum ditandai complete.

6. **Blocked?** Catat alasannya dengan `task fail`, jangan diam.

7. **Ganti fase = STOP.** Kalau task selesai dan `task next` mengembalikan fase baru,
   berhenti dan bilang ke user: "Fase [name] selesai. Verifikasi dulu di browser."
