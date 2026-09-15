import { useState } from 'react';
import './style.css';
export function EquipmentCard() {
  const [remaining] = useState(1);
  async function reserve() { await fetch('/reservations', { method: 'POST' }); }
  return <article className="equipment"><h1>Projector</h1><p>{remaining} place remaining</p><button onClick={reserve}>Resreve</button></article>;
}
