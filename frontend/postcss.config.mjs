import tailwindcss from 'tailwindcss';
import tailwindPostcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss({ config: './tailwind.config.ts' }),
    tailwindPostcss(),
    autoprefixer(),
  ],
}
