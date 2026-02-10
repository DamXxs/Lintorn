/*--------------------------------------------------------------- */
/* OUBLIER POUR L'INSTANT A VOIR AVEC LA SUITE SI ON GARDE OU PAS */
/*--------------------------------------------------------------- */



import React from 'react';
import './FloatingMenu.css';

const FloatingMenu = ({ onAddClick }) => {
    return (
        <aside className="floating-menu">
            <button onClick={onAddClick} className="bubble-btn" style={{background: '#bd7e21'}}>➕</button>
            <button className="bubble-btn" style={{background: '#bd7e21'}}>🔧</button>
            <button className="bubble-btn" style={{background: '#1646c1'}}>🎓</button>
        </aside>
    );
};

export default FloatingMenu;