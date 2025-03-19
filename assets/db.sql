CREATE TABLE transversales.empresa (
	emp_cod int4 DEFAULT 0 NULL,
	emp_reg varchar(10) NULL,
	emp_npatronal varchar(20) NULL,
	emp_nom varchar(100) NULL,
	emp_legal varchar(45) NULL,
	emp_activ varchar(100) NULL,
	emp_ntrab int4 NULL,
	emp_calle varchar(70) NULL,
	emp_num varchar(10) NULL,
	emp_telf varchar(40) NULL,
	emp_zona varchar(50) NULL,
	emp_localidad varchar(50) NULL,
	emp_fini_act date NULL,
	emp_lug varchar(35) NULL,
	emp_fec date NULL,
	emp_usu varchar(35) NULL,
	emp_estado varchar(20) NULL,
	emp_fec_baja date NULL,
	emp_obs varchar(1000) NULL,
	tipo varchar(5) NULL,
	emp_nom_corto varchar(30) NULL,
	emp_nit numeric(18) NULL,
	emp_matricula varchar(50) NULL,
	emp_cod_entidad varchar(35) null,
	fecha_registro timestamp NULL,
	fecha_modificacion timestamp NULL,
	usuario_registro varchar(20) NULL,
	usuario_modificacion varchar(20) NULL
	
);


CREATE TABLE transversales.planillas_aportes (
	id_planilla_aportes serial4 NOT NULL,
	cod_patronal varchar(200) NOT NULL,
	mes varchar(255) NULL,
	gestion varchar(255) NULL,
	total_importe numeric(10, 2) NOT NULL,
	estado int2 DEFAULT '1'::smallint NOT NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	observaciones text NULL,
	mensaje text NULL,
	com_nro int4 DEFAULT nextval('transversales.seq_comprobante'::regclass) NULL,
	total_trabaj int4 NOT NULL,
	empresa varchar(255) NULL,
	fecha_planilla date NULL,
	fecha_declarada timestamp NULL,
	fecha_pago timestamp NULL,
	aporte_10 numeric(10, 2) NULL,
	ufv_dia_formal numeric(10, 6) NULL,
	ufv_dia_presentacion numeric(10, 6) NULL,
	aporte_actualizado numeric(10, 2) NULL,
	monto_actualizado numeric(10, 2) NULL,
	multa_no_presentacion numeric(10, 2) NULL,
	dias_retraso int4 NULL,
	intereses numeric(10, 2) NULL,
	multa_sobre_intereses numeric(10, 2) NULL,
	total_a_cancelar numeric(10, 2) NULL,
	CONSTRAINT planillas_aportes_pkey PRIMARY KEY (id_planilla_aportes),
	CONSTRAINT unique_planilla UNIQUE (cod_patronal, mes, gestion)
);



CREATE TABLE transversales.planilla_aportes_detalles (
	id_planilla_aportes_detalles serial4 NOT NULL,
	id_planilla_aportes int8 NOT NULL,
	nro int8 NOT NULL,
	ci varchar(20) NOT NULL,
	apellido_paterno varchar(100) NULL,
	apellido_materno varchar(100) NULL,
	nombres varchar(100) NOT NULL,
	sexo varchar(10) NOT NULL,
	cargo varchar(100) NOT NULL,
	fecha_nac date NOT NULL,
	fecha_ingreso date NOT NULL,
	fecha_retiro date NULL,
	dias_pagados int4 NOT NULL,
	salario numeric(10, 2) NOT NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	regional varchar(255) NULL,
	haber_basico numeric(10, 2) NULL,
	bono_antiguedad numeric(10, 2) NULL,
	monto_horas_extra numeric(10, 2) NULL,
	monto_horas_extra_nocturnas numeric(10, 2) NULL,
	otros_bonos_pagos numeric(10, 2) NULL,
	CONSTRAINT planillas_aportes_detalles_pkey PRIMARY KEY (id_planilla_aportes_detalles)
);


-- transversales.planilla_aportes_detalles foreign keys

ALTER TABLE transversales.planilla_aportes_detalles ADD CONSTRAINT fk_planilla_aportes FOREIGN KEY (id_planilla_aportes) REFERENCES transversales.planillas_aportes(id_planilla_aportes) ON DELETE CASCADE;




CREATE TABLE transversales.pagos_aportes_mensuales (
	id_planilla_aportes int4 NOT NULL,
	fecha_pago timestamp NOT NULL,
	monto_pagado numeric(10, 2) NOT NULL,
	metodo_pago varchar(100) NULL,
	comprobante_pago varchar(255) NULL,
	foto_comprobante varchar(255) NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	observaciones text NULL,
	estado int2 DEFAULT 1 NOT NULL,
	CONSTRAINT pagos_planillas_pkey PRIMARY KEY (id_planilla_aportes)
);


-- transversales.pagos_aportes_mensuales foreign keys

ALTER TABLE transversales.pagos_aportes_mensuales ADD CONSTRAINT fk_planilla_aportes FOREIGN KEY (id_planilla_aportes) REFERENCES transversales.planillas_aportes(id_planilla_aportes) ON DELETE RESTRICT ON UPDATE CASCADE;



CREATE TABLE transversales.planillas_adicionales (
	id_planilla_adicional serial4 NOT NULL,
	id_planilla_aportes int8 NOT NULL,
	total_importe numeric(10, 2) NOT NULL,
	estado int2 DEFAULT '1'::smallint NOT NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	observaciones text NULL,
	motivo_adicional varchar(255) NULL,
	total_trabaj int4 NULL,
	fecha_declarada date NULL,
	CONSTRAINT planillas_adicionales_pkey PRIMARY KEY (id_planilla_adicional)
);


-- transversales.planillas_adicionales foreign keys

ALTER TABLE transversales.planillas_adicionales ADD CONSTRAINT fk_planilla_original FOREIGN KEY (id_planilla_aportes) REFERENCES transversales.planillas_aportes(id_planilla_aportes) ON DELETE RESTRICT;



CREATE TABLE transversales.planilla_adicional_detalles (
	id_planilla_adicional_detalles serial4 NOT NULL,
	id_planilla_adicional int8 NOT NULL,
	nro int8 NOT NULL,
	ci varchar(20) NOT NULL,
	apellido_paterno varchar(100) NULL,
	apellido_materno varchar(100) NULL,
	nombres varchar(100) NOT NULL,
	sexo varchar(10) NOT NULL,
	cargo varchar(100) NOT NULL,
	fecha_nac date NOT NULL,
	fecha_ingreso date NOT NULL,
	fecha_retiro date NULL,
	dias_pagados int4 NOT NULL,
	salario numeric(10, 2) NOT NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	regional varchar(255) NULL,
	haber_basico numeric(10, 2) NULL,
	bono_antiguedad numeric(10, 2) NULL,
	monto_horas_extra numeric(10, 2) NULL,
	monto_horas_extra_nocturnas numeric(10, 2) NULL,
	otros_bonos_pagos numeric(10, 2) NULL,
	CONSTRAINT planilla_adicional_detalles_pkey PRIMARY KEY (id_planilla_adicional_detalles)
);


-- transversales.planilla_adicional_detalles foreign keys

ALTER TABLE transversales.planilla_adicional_detalles ADD CONSTRAINT fk_planilla_adicional FOREIGN KEY (id_planilla_adicional) REFERENCES transversales.planillas_adicionales(id_planilla_adicional) ON DELETE CASCADE;



CREATE TABLE transversales.pagos_planillas_adicionales (
	id_planilla_adicional int4 NOT NULL,
	fecha_pago timestamp NOT NULL,
	monto_pagado numeric(10, 2) NOT NULL,
	metodo_pago varchar(100) NULL,
	comprobante_pago varchar(255) NULL,
	foto_comprobante varchar(255) NULL,
	usuario_creacion varchar(100) DEFAULT SESSION_USER NOT NULL,
	fecha_creacion timestamp DEFAULT now() NOT NULL,
	usuario_modificacion varchar(100) NULL,
	fecha_modificacion timestamp NULL,
	observaciones text NULL,
	estado int2 DEFAULT 1 NOT NULL,
	CONSTRAINT pagos_adicionales_pkey PRIMARY KEY (id_planilla_adicional)
);


-- transversales.pagos_planillas_adicionales foreign keys

ALTER TABLE transversales.pagos_planillas_adicionales ADD CONSTRAINT fk_planilla_adicional FOREIGN KEY (id_planilla_adicional) REFERENCES transversales.planillas_adicionales(id_planilla_adicional) ON DELETE RESTRICT ON UPDATE CASCADE;
