export default function PageBackground({ subtle = false }) {
  const op = subtle ? 0.6 : 1;
  return (
    <>
      {/* Geometric pattern */}
      <svg width="100%" style={{position:'fixed',left:0,top:-60,width:'100%',height:'calc(100% + 120px)',zIndex:0,pointerEvents:'none',animation:'patDrift 40s linear infinite',opacity:subtle?0.5:1}} aria-hidden="true">
        <defs>
          <pattern id="bgStars" width="60" height="60" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="rgba(27,67,50,0.05)" strokeWidth="1">
              <rect x="15" y="15" width="30" height="30"/>
              <rect x="15" y="15" width="30" height="30" transform="rotate(45 30 30)"/>
              <circle cx="30" cy="30" r="3"/>
            </g>
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#bgStars)"/>
      </svg>

      {/* Orb glows */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-120,left:'50%',transform:'translateX(-50%)',width:640,height:640,borderRadius:'50%',background:'radial-gradient(circle,rgba(27,67,50,0.07),transparent 68%)',filter:'blur(120px)',animation:'orbA 14s ease-in-out infinite',opacity:op}}/>
        <div style={{position:'absolute',bottom:-160,left:-120,width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(184,150,90,0.06),transparent 68%)',filter:'blur(120px)',animation:'orbB 17s ease-in-out infinite',opacity:op}}/>
        <div style={{position:'absolute',top:'42%',right:-120,width:440,height:440,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,106,79,0.06),transparent 68%)',filter:'blur(120px)',animation:'orbC 12s ease-in-out infinite',opacity:op}}/>
      </div>
    </>
  );
}
