-- Función para incrementar el contador de búsquedas de códigos postales
CREATE OR REPLACE FUNCTION increment_postal_code_search(
  p_postal_code TEXT,
  p_country_code TEXT,
  p_place_name TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE postal_codes 
  SET search_count = search_count + 1,
      updated_at = NOW()
  WHERE postal_code = p_postal_code 
    AND country_code = p_country_code 
    AND place_name = p_place_name;
END;
$$ LANGUAGE plpgsql;

-- Comentario para la función
COMMENT ON FUNCTION increment_postal_code_search(TEXT, TEXT, TEXT) IS 'Incrementa el contador de búsquedas para un código postal específico';