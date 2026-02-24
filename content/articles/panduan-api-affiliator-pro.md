---
title: "Cara Menggunakan API Affiliator Pro untuk Integrasi Otomatis"
description: "Panduan teknis menggunakan REST API Affiliator Pro untuk mengintegrasikan fitur AI ke aplikasi atau workflow Anda."
category: "Tutorial"
author: "Tim Affiliator Pro"
date: "2026-01-25"
readTime: "7 min read"
image: "/images/blog/api-integration.jpg"
---

## Pendahuluan

Affiliator Pro tidak hanya menyediakan antarmuka web yang mudah digunakan, tetapi juga REST API yang powerful untuk developer dan power user. Dengan API, Anda bisa mengintegrasikan kemampuan AI ke aplikasi, bot, atau workflow automation Anda.

## Keuntungan Menggunakan API

- **Otomatisasi** - Generate konten secara otomatis tanpa manual intervention
- **Scalability** - Proses ribuan request dengan efisien
- **Integration** - Hubungkan dengan tools lain seperti Zapier, Make, n8n
- **Customization** - Bangun UI/UX sesuai kebutuhan Anda

## Mendapatkan API Key

Sebelum mulai, Anda perlu:

1. Login ke dashboard Affiliator Pro
2. Buka menu **API Docs**
3. Klik **Generate API Key**
4. Simpan API Key dengan aman (hanya ditampilkan sekali)

> ⚠️ **Penting**: Jangan share API Key Anda. Jika bocor, segera regenerate.

## Endpoint yang Tersedia

### 1. Generate Image

```bash
POST /api/generate/image
```

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "Product photography of wireless earbuds, white background",
  "aspectRatio": "1:1",
  "style": "product_photography"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://...",
  "remainingCredits": 45
}
```

### 2. Generate Video

```bash
POST /api/generate/video
```

**Body:**
```json
{
  "prompt": "Cinematic product reveal of smartphone",
  "aspectRatio": "9:16",
  "duration": 5
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "abc123",
  "status": "processing"
}
```

### 3. Check Video Status

```bash
GET /api/generate/video/status?jobId=abc123
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "videoUrl": "https://..."
}
```

## Contoh Implementasi

### JavaScript/Node.js

```javascript
const response = await fetch('https://affiliator.pro/api/generate/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Minimalist product photo of skincare bottle',
    aspectRatio: '1:1',
  }),
});

const data = await response.json();
console.log('Image URL:', data.imageUrl);
```

### Python

```python
import requests

response = requests.post(
    'https://affiliator.pro/api/generate/image',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'prompt': 'Minimalist product photo of skincare bottle',
        'aspectRatio': '1:1',
    }
)

data = response.json()
print('Image URL:', data['imageUrl'])
```

### cURL

```bash
curl -X POST https://affiliator.pro/api/generate/image \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Product photo","aspectRatio":"1:1"}'
```

## Rate Limiting

API memiliki rate limit sebagai berikut:

| Plan | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 10 | 100 |
| Pro | 60 | 1000 |
| Enterprise | Custom | Custom |

Jika melebihi limit, API akan return error 429 (Too Many Requests).

## Error Handling

Selalu handle error dengan baik:

```javascript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  // Process data
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

## Best Practices

1. **Cache responses** - Hindari generate ulang konten yang sama
2. **Queue requests** - Jangan blast API secara parallel
3. **Handle async properly** - Video generation memerlukan polling
4. **Secure API Key** - Gunakan environment variables
5. **Monitor usage** - Track credit consumption

## Use Cases

### 1. E-commerce Automation
Generate gambar produk otomatis saat seller upload produk baru.

### 2. Social Media Bot
Buat bot yang generate dan post konten secara terjadwal.

### 3. Chrome Extension
Bangun extension yang generate gambar langsung dari browser.

### 4. Telegram/WhatsApp Bot
Reply dengan gambar/video AI berdasarkan pesan user.

## Kesimpulan

API Affiliator Pro membuka berbagai kemungkinan untuk otomatisasi dan integrasi. Dengan dokumentasi yang jelas dan endpoint yang powerful, Anda bisa membangun solusi custom sesuai kebutuhan bisnis.

Mulai eksplorasi API di halaman [API Docs](/dashboard/api-docs) atau hubungi kami untuk kebutuhan enterprise.

---

*Butuh bantuan integrasi API? Tim teknis kami siap membantu melalui halaman [Kontak](/contact).*
