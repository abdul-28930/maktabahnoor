const OFFER_STYLES = {
  'Sale':            { bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.3)',  color: '#dc2626' },
  'Limited Edition': { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', color: '#7c3aed' },
};
const OFFER_DEFAULT = { bg: 'rgba(184,150,90,0.1)', border: 'rgba(184,150,90,0.3)', color: '#b8965a' };

export default function OfferBadge({ type, size = 'sm' }) {
  if (!type) return null;
  const s = OFFER_STYLES[type] || OFFER_DEFAULT;
  const fontSize = size === 'sm' ? 9 : 11;
  return (
    <span style={{padding:size==='sm'?'2px 9px':'5px 14px',borderRadius:20,fontSize,fontWeight:600,letterSpacing:.8,textTransform:'uppercase',
      background:s.bg,border:`1px solid ${s.border}`,color:s.color,whiteSpace:'nowrap'}}>
      {type}
    </span>
  );
}
