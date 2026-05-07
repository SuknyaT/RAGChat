import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Info } from 'lucide-react';

interface AudienceVisualsProps {
  signals: any[];
  insights?: string;
}

const AudienceVisuals: React.FC<AudienceVisualsProps> = ({ signals, insights }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Venn Diagram Visual */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Audience Overlap</h4>
        <div style={{ height: '180px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="240" height="180" viewBox="0 0 240 180">
            {/* Circle 1: Interests/Demographics */}
            <motion.circle 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              cx="100" cy="90" r="70" 
              fill="rgba(56, 189, 248, 0.2)" 
              stroke="var(--primary)" 
              strokeWidth="2" 
            />
            {/* Circle 2: Location/Transaction */}
            <motion.circle 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              cx="140" cy="90" r="70" 
              fill="rgba(16, 185, 129, 0.2)" 
              stroke="var(--secondary)" 
              strokeWidth="2" 
            />
            <text x="70" y="80" fill="white" fontSize="10" fontWeight="bold">Psychographic</text>
            <text x="130" y="80" fill="white" fontSize="10" fontWeight="bold">Behavioral</text>
            <text x="110" y="110" fill="white" fontSize="12" fontWeight="bold">TARGET</text>
          </svg>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
          Intersection of intent and physical presence
        </p>
      </div>

      {/* Mocked Heatmap Visual */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Geographic Density</h4>
        <div style={{ 
          height: '150px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '12px', 
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          {/* Abstract Map Lines */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          {/* Heatmap Blobs */}
          {[1,2,3,4,5].map(i => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 + i, delay: i }}
              style={{ 
                position: 'absolute',
                width: 40 + (i * 20),
                height: 40 + (i * 20),
                borderRadius: '50%',
                background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
                filter: 'blur(30px)',
                left: `${Math.random() * 70}%`,
                top: `${Math.random() * 70}%`,
              }}
            />
          ))}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'white' }}>
            <MapPin size={12} /> High Activity Nodes
          </div>
        </div>
      </div>

      {/* Strategic Insights */}
      {insights && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(16, 185, 129, 0.1))',
            border: '1px solid var(--primary)',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--primary)' }}>
            <Info size={18} />
            <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Strategic Insight</h4>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-main)' }}>
            {insights}
          </p>
        </motion.div>
      )}

    </div>
  );
};

export default AudienceVisuals;
