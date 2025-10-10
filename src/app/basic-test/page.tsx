'use client'

export default function BasicTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Básico de Input</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Input HTML Puro:</label>
        <input 
          type="text" 
          placeholder="Escribe aquí..."
          onChange={(e) => console.log('✅ HTML onChange:', e.target.value)}
          onInput={(e) => console.log('✅ HTML onInput:', (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => console.log('✅ HTML onKeyDown:', e.key)}
          onFocus={() => console.log('✅ HTML onFocus')}
          onBlur={() => console.log('✅ HTML onBlur')}
          onClick={() => console.log('✅ HTML onClick')}
          style={{ 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            width: '300px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => console.log('✅ BUTTON onClick')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>

      <div>
        <p>Instrucciones:</p>
        <ul>
          <li>Haz clic en el input</li>
          <li>Escribe algo</li>
          <li>Presiona teclas</li>
          <li>Haz clic en el botón</li>
          <li>Revisa la consola del navegador</li>
        </ul>
      </div>
    </div>
  )
}