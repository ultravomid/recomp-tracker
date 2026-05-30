# 🚀 QUICK SETUP — Upload ke GitHub & Deploy (5 Menit)

## Step 1: Persiapan (1 menit)

Pastikan punya:
- ✅ GitHub account (https://github.com/signup)
- ✅ Folder kosong di komputer (cth: `/Users/ahmad/recomp-tracker`)

---

## Step 2: Buat Repository di GitHub (1 menit)

1. **Login GitHub** → https://github.com
2. **Klik +** (atas kanan) → **New repository**
3. **Nama:** `recomp-tracker`
4. **Deskripsi:** "Evidence-based body composition tracking app"
5. **Public** (jangan private)
6. ✅ **Initialize with README**
7. **Create repository**

Dapat URL: `https://github.com/USERNAME/recomp-tracker`

---

## Step 3: Upload File ke GitHub (1 menit)

Di halaman repo yang baru dibuat:

1. **Add file** → **Upload files**
2. Drag & drop:
   - `recomp-tracker.html`
   - `README.md`
   - `.gitignore`
3. **Commit changes**

Selesai! File sudah di GitHub.

---

## Step 4: Deploy ke Netlify (2 menit)

1. **Buka** https://netlify.com
2. **Sign up with GitHub** (approve akses)
3. **New site from Git** → Pilih `recomp-tracker`
4. **Build settings:**
   - Build command: (kosongkan)
   - Publish directory: (kosongkan)
5. **Deploy site**

Tunggu sebentar... ✅ Done!

Dapat URL: `https://recomp-tracker-USERNAME.netlify.app`

---

## Step 5: Buka & Gunakan (Instant)

1. **Buka link Netlify**
2. Bookmark / Add to Home Screen
3. **Mulai track:** Beranda tab → log aktivitas

---

## ✅ Selesai!

- 🌐 **Live URL:** Share ke siapa saja
- 📱 **Offline:** Buka tanpa internet, data tersimpan
- 🔄 **Update:** Edit file HTML di GitHub → auto-deploy ke Netlify
- 💾 **Backup:** Export .json di app weekly ke Google Drive

---

## Troubleshooting

**Q: Deploy gagal?**  
A: Pastikan file ada `.html`. Netlify auto-detect. Refresh page setelah push.

**Q: Mau edit data tapi tidak bisa?**  
A: Data di localStorage browser. Clear cache = data hilang. Selalu export dulu!

**Q: Mau update app ke versi baru?**  
A: Push file baru ke GitHub → Netlify auto-update (~30 detik).

---

**Siap? Mulai di GitHub sekarang! 🚀**
