'use client';

import { Product } from '@/lib/data';
import { eur } from '@/lib/data';
import Photo from './Photo';
import Allergens from './Allergens';
import QtyStepper from './QtyStepper';

interface ProductCardProps {
  product: Product;
  qty: number;
  onChange: (v: number) => void;
}

export default function ProductCard({ product, qty, onChange }: ProductCardProps) {
  return (
    <div className="card prod">
      <Photo label={product.photo} className="prod-img" tint={product.hue} />
      <div className="prod-body">
        <div className="prod-row">
          <h3 className="prod-name">{product.name}</h3>
          <span className="prod-price">{eur(product.price)}<small> /nem</small></span>
        </div>
        <p className="prod-desc">{product.desc}</p>
        <Allergens list={product.allergens} />
        <QtyStepper value={qty} onChange={onChange} />
      </div>
    </div>
  );
}
