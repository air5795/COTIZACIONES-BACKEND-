-- Tabla empresa
CREATE TABLE empresa (
  id_empresa SERIAL PRIMARY KEY,
  numero_patronal VARCHAR(255),
  razon_social VARCHAR(255),
  tipo VARCHAR(255),
  nit VARCHAR(255),
  telf_celular VARCHAR(255),
  domicilio VARCHAR(255),
  correo VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tabla regional
CREATE TABLE regional (
  id_regional SERIAL PRIMARY KEY,
  nombre_regional VARCHAR(255),
  codigo_regional VARCHAR(255),
  domicilio VARCHAR(255),
  celular VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE,
  id_empresa INTEGER REFERENCES empresa(id_empresa)
);

-- Tabla tasa_interes_aporte
CREATE TABLE tasa_interes_aporte (
  id_tasa SERIAL PRIMARY KEY,
  porcentaje DECIMAL,
  vigente BOOLEAN,
  observaciones VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla empleado
CREATE TABLE empleado (
  matricula VARCHAR(255) PRIMARY KEY,
  carnet_identidad VARCHAR(255),
  nombres VARCHAR(255),
  apellido_paterno VARCHAR(255),
  apellido_materno VARCHAR(255),
  cargo VARCHAR(255),
  gestion DATE,
  dias_trabajados INTEGER,
  total_ganado DECIMAL,
  fecha_ingreso DATE,
  fecha_retiro DATE,
  nacionalidad VARCHAR(255),
  fecha_nacimiento DATE,
  validado_afilaciones BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  id_regional INTEGER REFERENCES regional(id_regional)
);

-- Tabla salario_minimo
CREATE TABLE salario_minimo (
  id_salario_minimo SERIAL PRIMARY KEY,
  gestion DATE,
  monto DECIMAL,
  vigente BOOLEAN,
  observaciones VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla tipo_planilla
CREATE TABLE tipo_planilla (
  id_tipo_planilla SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tabla planilla
CREATE TABLE planilla (
  id_planilla SERIAL PRIMARY KEY,
  id_tipo_planilla INTEGER REFERENCES tipo_planilla(id_tipo_planilla),
  dias_trabajados INTEGER,
  cargo VARCHAR(255),
  fecha_ingreso DATE,
  fecha_retiro DATE,
  total_ganado DECIMAL,
  fecha DATE,
  observaciones TEXT,
  aprobado BOOLEAN DEFAULT FALSE,
  fecha_aprobacion DATE,
  aprobado_por INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE,
  id_tasa INTEGER REFERENCES tasa_interes_aporte(id_tasa)
);

-- Tabla regional_empleado_planilla
CREATE TABLE regional_empleado_planilla (
  id SERIAL PRIMARY KEY,
  id_regional INTEGER REFERENCES regional(id_regional),
  matricula VARCHAR(255) REFERENCES empleado(matricula),
  id_planilla INTEGER REFERENCES planilla(id_planilla),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla tipo_incapacidad
CREATE TABLE tipo_incapacidad (
  id_tipo_incapacidad SERIAL PRIMARY KEY,
  descripcion VARCHAR(255),
  porcentaje_aporte DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla planilla_incapacidades
CREATE TABLE planilla_incapacidades (
  id_planilla_incapacidad SERIAL PRIMARY KEY,
  matricula VARCHAR(255) REFERENCES empleado(matricula),
  id_tipo_incapacidad INTEGER REFERENCES tipo_incapacidad(id_tipo_incapacidad),
  fecha_inicio DATE,
  fecha_fin DATE,
  dias_incapacidad INTEGER,
  subsidio_por_dia DECIMAL,
  monto_reconocido DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla resumen_mensual_regional
CREATE TABLE resumen_mensual_regional (
  id_resumen SERIAL PRIMARY KEY,
  id_regional INTEGER REFERENCES regional(id_regional),
  mes DATE,
  total_aporte_salarios DECIMAL,
  numero_trabajadores INTEGER,
  total_aportes DECIMAL,
  id_tasa INTEGER REFERENCES tasa_interes_aporte(id_tasa),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla ufv
CREATE TABLE ufv (
  fecha DATE PRIMARY KEY,
  valor_ufv DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER
);

-- Tabla tipo_cite
CREATE TABLE tipo_cite (
  id_tipo_cite SERIAL PRIMARY KEY,
  descripcion VARCHAR(255)
);

-- Tabla control_codigos
CREATE TABLE control_codigos (
  id_control SERIAL PRIMARY KEY,
  id_tipo_cite INTEGER REFERENCES tipo_cite(id_tipo_cite),
  ultimo_codigo INTEGER,
  year INTEGER
);

-- Tabla planilla_aportes_devengados
CREATE TABLE planilla_aportes_devengados (
  id_planilla_devengados SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresa(id_empresa),
  fecha DATE,
  total_devengado DECIMAL,
  descripcion TEXT,
  aprobado BOOLEAN DEFAULT FALSE,
  fecha_aprobacion DATE,
  aprobado_por INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  id_tasa INTEGER REFERENCES tasa_interes_aporte(id_tasa),
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tabla tipo_multas
CREATE TABLE tipo_multas (
  id_tipo_multa SERIAL PRIMARY KEY,
  descripcion VARCHAR(255),
  detalles TEXT,
  monto_base DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tabla multas
CREATE TABLE multas (
  id_multa SERIAL PRIMARY KEY,
  id_tipo_multa INTEGER REFERENCES tipo_multas(id_tipo_multa),
  descripcion VARCHAR(255),
  monto DECIMAL,
  fecha_imposicion DATE,
  fecha_pago DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tabla parte_baja_asegurado
CREATE TABLE parte_baja_asegurado (
  id_parte_baja SERIAL PRIMARY KEY,
  matricula VARCHAR(255) REFERENCES empleado(matricula),
  id_multa INTEGER REFERENCES multas(id_multa),
  fecha_informe DATE,
  motivo_baja VARCHAR(255),
  observaciones TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INTEGER,
  id_regional INTEGER REFERENCES regional(id_regional),
  baja_logica BOOLEAN DEFAULT TRUE
);

-- Tablas auditoria
CREATE TABLE empleado_auditoria (
  id_auditoria SERIAL PRIMARY KEY,
  accion CHAR(1) NOT NULL, -- 'I' para INSERT, 'U' para UPDATE, 'D' para DELETE
  matricula VARCHAR(255),
  carnet_identidad VARCHAR(255),
  nombres VARCHAR(255),
  apellido_paterno VARCHAR(255),
  apellido_materno VARCHAR(255),
  cargo VARCHAR(255),
  gestion DATE,
  dias_trabajados INT,
  total_ganado DECIMAL,
  fecha_ingreso DATE,
  fecha_retiro DATE,
  nacionalidad VARCHAR(255),
  fecha_nacimiento DATE,
  validado_afilaciones BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id INT,
  id_regional INT,
  timestamp_auditoria TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para INSERT
CREATE OR REPLACE FUNCTION empleado_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO empleado_auditoria(accion, matricula, carnet_identidad, nombres, apellido_paterno, apellido_materno, cargo, gestion, dias_trabajados, total_ganado, fecha_ingreso, fecha_retiro, nacionalidad, fecha_nacimiento, validado_afilaciones, created_at, updated_at, user_id, id_regional) 
  VALUES ('I', NEW.matricula, NEW.carnet_identidad, NEW.nombres, NEW.apellido_paterno, NEW.apellido_materno, NEW.cargo, NEW.gestion, NEW.dias_trabajados, NEW.total_ganado, NEW.fecha_ingreso, NEW.fecha_retiro, NEW.nacionalidad, NEW.fecha_nacimiento, NEW.validado_afilaciones, NEW.created_at, NEW.updated_at, NEW.user_id, NEW.id_regional);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empleado_insert_trigger
AFTER INSERT ON empleado
FOR EACH ROW EXECUTE FUNCTION empleado_insert_trigger();

-- Puedes hacer algo similar para UPDATE y DELETE

