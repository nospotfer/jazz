# Images Folder

Esta pasta contém todas as imagens do projeto Jazz LMS.

## Como adicionar uma imagem:

1. Coloque sua imagem nesta pasta: `/public/images/`
2. No código, referencie como: `/images/nome-da-sua-imagem.jpg`

## Imagem principal do Hero:

A imagem central do hero está configurada em:
- **Arquivo**: `src/components/landing/hero.tsx`
- **Linha**: Procure por `src="/images/jazz-placeholder.jpg"`
- **Para trocar**: Substitua `jazz-placeholder.jpg` pelo nome da sua imagem

Exemplo:
```tsx
<Image
  src="/images/sua-imagem.jpg"
  alt="Jazz Course Image"
  fill
  className="object-cover"
  priority
/>
```

## Formatos suportados:
- JPG/JPEG
- PNG
- WebP
- GIF
- SVG
