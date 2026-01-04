
MINIMAL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A5 portrait;
            margin: 1cm;
        }
        body {
            font-family: sans-serif;
            color: #2c3e50;
            font-size: 9pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        
        /* REGLA DE LOS 18.5 CM - Garantía de Página Única */
        .safe-zone {
            height: 18.5cm;
            max-height: 18.5cm;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            flex-shrink: 0;
        }
        
        .logo-container {
            flex-shrink: 0;
            width: 65px;
            height: 65px;
            margin-right: 10px;
        }
        
        .logo-img {
            width: 65px;
            height: 65px;
            object-fit: contain;
        }
        
        .logo-placeholder {
            width: 65px;
            height: 65px;
            background-color: {{ primary_color|default('#4a90e2') }};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28pt;
            color: white;
        }
        
        .doctor-info {
            flex-grow: 1;
        }
        
        .doctor-name {
            font-size: 15pt;
            font-weight: bold;
            color: {{ primary_color|default('#4a90e2') }};
            margin: 0 0 3px 0;
        }
        
        .qualification {
            font-size: 8pt;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 5px 0;
        }
        
        .divider-line {
            border-bottom: 2px solid {{ primary_color|default('#4a90e2') }};
            margin: 5px 0;
        }
        
        .cert-number {
            font-size: 7pt;
            color: #7f8c8d;
            margin: 3px 0 0 0;
        }
        
        .hospital-info {
            flex-shrink: 0;
            text-align: right;
            margin-left: 10px;
        }
        
        .hospital-name {
            font-size: 11pt;
            font-weight: bold;
            color: {{ primary_color|default('#4a90e2') }};
            margin: 0 0 2px 0;
        }
        
        .hospital-slogan {
            font-size: 7pt;
            color: #95a5a6;
            margin: 0;
        }
        
        .content {
            flex-grow: 1;
            overflow: hidden;
        }
        
        .patient-section {
            background-color: #e8f4f8;
            padding: 8px;
            margin: 10px 0;
            border-radius: 3px;
        }
        
        .patient-field {
            margin: 5px 0;
            font-size: 8pt;
        }
        
        .field-label {
            font-weight: bold;
            color: #34495e;
            display: inline;
        }
        
        .field-value {
            display: inline;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 1px;
        }
        
        .patient-row {
            display: flex;
            gap: 12px;
        }
        
        .patient-row .patient-field {
            flex: 1;
        }
        
        .rx-symbol {
            font-size: 48pt;
            font-weight: bold;
            color: {{ primary_color|default('#4a90e2') }};
            margin: 12px 0 10px 0;
            line-height: 1;
        }
        
        .treatment-area {
            max-height: 160px;
            overflow: hidden;
            margin-bottom: 8px;
            font-size: 8.5pt;
            line-height: 1.3;
        }
        
        .section-title {
            font-weight: bold;
            color: {{ primary_color|default('#4a90e2') }};
            font-size: 9pt;
            margin: 12px 0 6px 0;
        }
        
        .footer {
            border-top: 1px solid #ecf0f1;
            padding-top: 6px;
            margin-top: auto;
            font-size: 7pt;
            color: #7f8c8d;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            position: relative;
        }
        .footer-qr {
            width: 45px;
            height: 45px;
            position: absolute;
            right: 0;
            bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="safe-zone">
        <div class="header">
            <div class="logo-container">
                {% if logo_base64 %}
                <img src="data:image/png;base64,{{ logo_base64 }}" class="logo-img" alt="Logo" />
                {% else %}
                <div class="logo-placeholder">🩺</div>
                {% endif %}
            </div>
            
            <div class="doctor-info">
                <p class="doctor-name">Dr. {{ doctor.professional_name }}</p>
                <p class="qualification">{{ doctor.specialty }}</p>
                <div class="divider-line"></div>
                <p class="cert-number">Reg: {{ doctor.phone }}</p>
            </div>
            
            <div class="hospital-info">
                <p class="hospital-name">CONSULTORIO</p>
                <p class="hospital-slogan">Atención Profesional</p>
            </div>
        </div>
        
        <div class="content">
            <div class="patient-section">
                <div class="patient-field">
                    <span class="field-label">Paciente:</span>
                    <span class="field-value">{{ patient.nombre }} {{ patient.apellido_paterno }}</span>
                </div>
                <div class="patient-field">
                    <span class="field-label">Dirección:</span>
                    <span class="field-value">{{ doctor.address }}</span>
                </div>
                <div class="patient-row">
                    <div class="patient-field">
                        <span class="field-label">DNI:</span>
                        <span class="field-value">{{ patient.dni }}</span>
                    </div>
                    <div class="patient-field">
                        <span class="field-label">Fecha:</span>
                        <span class="field-value">{{ date }}</span>
                    </div>
                </div>
                <div class="patient-field">
                    <span class="field-label">Diagnóstico:</span>
                    <span class="field-value">{{ consultation.diagnosis }}</span>
                </div>
            </div>
            
            <div class="rx-symbol">℞</div>
            
            <div class="treatment-area">
                <p>{{ consultation.treatment }}</p>
                
                {% if consultation.notes %}
                <p class="section-title">OBSERVACIONES</p>
                <p>{{ consultation.notes }}</p>
                {% endif %}
            </div>
        </div>
        
        <div class="footer">
            <div style="display: flex; gap: 10px;">
                <span>📞 {{ doctor.phone }}</span>
                <span>✉ contacto@consultorio.com</span>
                <span>📍 {{ doctor.address }}</span>
            </div>
            {% if qr_base64 %}
            <img src="data:image/png;base64,{{ qr_base64 }}" class="footer-qr" alt="QR" />
            {% endif %}
        </div>
    </div>
</body>
</html>
"""

MODERN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A5 portrait;
            margin: 1cm;
        }
        body {
            font-family: sans-serif;
            color: #2c3e50;
            font-size: 9pt;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        /* REGLA DE LOS 18.5 CM - Garantía de Página Única */
        .safe-zone {
            height: 18.5cm;
            max-height: 18.5cm;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
        }
        
        .header-bar {
            background-color: {{ primary_color|default('#1e5a8e') }};
            height: 3.5cm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            margin: -1cm -1cm 15px -1cm;
        }
        
        .logo-box {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 120px;
            height: 80px;
        }
        
        .logo-img {
            max-width: 100px;
            max-height: 70px;
            object-fit: contain;
        }
        
        .logo-placeholder {
            font-size: 48pt;
            color: {{ primary_color|default('#1e5a8e') }};
        }
        
        .prescription-title {
            font-size: 22pt;
            font-weight: bold;
            color: white;
            letter-spacing: 3px;
            margin: 0;
        }
        
        .content-area {
            padding: 0 10px;
        }
        
        .doctor-name-modern {
            font-size: 20pt;
            font-weight: bold;
            color: {{ primary_color|default('#1e5a8e') }};
            margin: 10px 0 5px 0;
        }
        
        .doctor-specialty {
            font-size: 10pt;
            color: #34495e;
            margin: 0 0 3px 0;
        }
        
        .doctor-tagline {
            font-size: 8pt;
            color: #7f8c8d;
            font-style: italic;
            margin: 0 0 20px 0;
        }
        
        .fields-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 20px;
            margin: 20px 0;
        }
        
        .field-modern {
            margin-bottom: 10px;
        }
        
        .field-label-modern {
            font-weight: bold;
            color: {{ primary_color|default('#1e5a8e') }};
            font-size: 8pt;
            margin: 0 0 3px 0;
        }
        
        .field-input {
            border-bottom: 1px solid #d0d0d0;
            padding: 5px 0;
            margin: 0;
        }
        
        .rx-large {
            font-size: 36pt;
            font-weight: bold;
            color: {{ primary_color|default('#1e5a8e') }};
            margin: 15px 0;
            line-height: 1;
        }
        
        .treatment-content {
            margin-bottom: 60px;
        }
        
        .signature-area {
            text-align: right;
            margin-top: 40px;
        }
        
        .signature-label {
            font-size: 8pt;
            color: {{ primary_color|default('#1e5a8e') }};
            font-weight: bold;
            margin: 0 0 25px 0;
        }
        
        .signature-line {
            border-top: 1px solid #34495e;
            width: 200px;
            margin-left: auto;
            padding-top: 5px;
            text-align: center;
            font-size: 8pt;
            color: #7f8c8d;
        }
        
        .footer-bar {
            background-color: {{ primary_color|default('#5dade2') }};
            color: white;
            font-size: 7pt;
            padding: 15px 20px;
            margin: 40px -1cm -1cm -1cm;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .qr-placeholder {
            width: 60px;
            height: 60px;
            background-color: white;
            border-radius: 3px;
        }
        
        .footer-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
    </style>
</head>
<body>
    <div class="safe-zone">
    <div class="header-bar">
        <div class="logo-box">
            {% if logo_base64 %}
            <img src="data:image/png;base64,{{ logo_base64 }}" class="logo-img" alt="Logo" />
            {% else %}
            <div class="logo-placeholder">🩺</div>
            {% endif %}
        </div>
        <p class="prescription-title">PRESCRIPTION</p>
    </div>
    
    <div class="content-area">
        <p class="doctor-name-modern">Dr. {{ doctor.professional_name }}</p>
        <p class="doctor-specialty">{{ doctor.specialty }}</p>
        <p class="doctor-tagline">your tagline here</p>
        
        <div class="fields-grid">
            <div class="field-modern">
                <p class="field-label-modern">Patient Name</p>
                <p class="field-input">{{ patient.nombre }} {{ patient.apellido_paterno }}</p>
            </div>
            <div class="field-modern">
                <p class="field-label-modern">Insurance</p>
                <p class="field-input">{{ patient.dni }}</p>
            </div>
            <div class="field-modern">
                <p class="field-label-modern">Address</p>
                <p class="field-input">{{ doctor.address }}</p>
            </div>
            <div class="field-modern">
                <p class="field-label-modern">Diagnosis</p>
                <p class="field-input">{{ consultation.diagnosis }}</p>
            </div>
            <div class="field-modern">
                <p class="field-label-modern">Date</p>
                <p class="field-input">{{ date }}</p>
            </div>
        </div>
        
        <div class="rx-large">Rx</div>
        
        <div class="treatment-content">
            <p>{{ consultation.treatment }}</p>
            
            {% if consultation.notes %}
            <p style="margin-top: 15px; font-weight: bold; color: {{ primary_color|default('#1e5a8e') }};">Observations:</p>
            <p>{{ consultation.notes }}</p>
            {% endif %}
        </div>
        
        <div class="signature-area">
            <p class="signature-label">Signature</p>
            <div class="signature-line">_________________________</div>
        </div>
    </div>
    
    <div class="footer-bar">
        <div class="qr-placeholder">
            {% if qr_base64 %}
            <img src="data:image/png;base64,{{ qr_base64 }}" style="width: 56px; height: 56px;" />
            {% endif %}
        </div>
        <div class="footer-info">
            <span>📞 + (00) 123 456 789</span>
            <span>✉ company@mail.com</span>
        </div>
        <div class="footer-info" style="text-align: right;">
            <span>🌐 www.companyname.com</span>
            <span>📍 your company address</span>
        </div>
    </div>
    </div>
</body>
</html>
"""

CLASSIC_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A5 portrait;
            margin: 1cm;
        }
        body {
            font-family: serif;
            color: #2c3e50;
            font-size: 9pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        
        /* REGLA DE LOS 18.5 CM - Garantía de Página Única */
        .safe-zone {
            height: 18.5cm;
            max-height: 18.5cm;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 2px solid {{ primary_color|default('#5dade2') }};
            height: 100%;
        }
        td {
            vertical-align: top;
        }
        .header-row {
            height: 80px;
            border-bottom: 1px solid {{ primary_color|default('#5dade2') }};
        }
        .body-row {
            height: auto;
        }
        .footer-row {
            height: 40px;
            border-top: 1px solid {{ primary_color|default('#5dade2') }};
        }
        .doctor-name-classic {
            font-size: 16pt;
            font-weight: bold;
            color: {{ primary_color|default('#5dade2') }};
            margin: 0 0 3px 0;
            font-family: Georgia, serif;
        }
        .doctor-specialty-classic {
            font-size: 9pt;
            color: #7f8c8d;
            margin: 0 0 2px 0;
        }
        .doctor-cert {
            font-size: 7pt;
            color: #95a5a6;
            margin: 0;
        }
        .label-classic {
            font-weight: bold;
            color: #34495e;
            font-size: 8pt;
            margin: 0 0 2px 0;
        }
        .input-classic {
            border-bottom: 1px solid #d5d8dc;
            padding: 2px 0;
            margin: 0 0 6px 0;
            font-size: 8pt;
        }
        .rx-classic {
            font-size: 36pt;
            font-weight: bold;
            color: {{ primary_color|default('#5dade2') }};
            margin: 8px 0;
            font-family: Georgia, serif;
            line-height: 1;
        }
        .treatment-area {
            max-height: 120px;
            overflow: hidden;
            margin: 6px 0 20px 0;
            font-family: Arial, sans-serif;
            font-size: 8pt;
        }
        .footer-text {
            font-size: 6pt;
            color: #7f8c8d;
            text-align: center;
            padding: 6px;
            position: relative;
        }
        .classic-qr {
            width: 35px;
            height: 35px;
            position: absolute;
            right: 5px;
            top: 2px;
        }
    </style>
</head>
<body>
    <div class="safe-zone">
    <table>
        <!-- HEADER ROW -->
        <tr class="header-row">
            <td colspan="2" style="padding: 10px; text-align: center;">
                <p class="doctor-name-classic">Dr. {{ doctor.professional_name }}</p>
                <p class="doctor-specialty-classic">{{ doctor.specialty }}</p>
                <p class="doctor-cert">Medical License No. {{ doctor.phone }}</p>
            </td>
        </tr>
        
        <!-- BODY ROW -->
        <tr class="body-row">
            <td colspan="2" style="padding: 10px;">
                <div style="margin-bottom: 6px;">
                    <p class="label-classic">Patient Name:</p>
                    <p class="input-classic">{{ patient.nombre }} {{ patient.apellido_paterno }}</p>
                </div>
                <div style="margin-bottom: 6px;">
                    <p class="label-classic">Date:</p>
                    <p class="input-classic">{{ date }}</p>
                </div>
                <div style="margin-bottom: 6px;">
                    <p class="label-classic">Address:</p>
                    <p class="input-classic">{{ doctor.address }}</p>
                </div>
                <div style="margin-bottom: 6px;">
                    <p class="label-classic">ID Number:</p>
                    <p class="input-classic">{{ patient.dni }}</p>
                </div>
                <div style="margin-bottom: 8px;">
                    <p class="label-classic">Diagnosis:</p>
                    <p class="input-classic">{{ consultation.diagnosis }}</p>
                </div>
                
                <p class="rx-classic">℞</p>
                
                <div class="treatment-area">
                    <p>{{ consultation.treatment }}</p>
                    {% if consultation.notes %}
                    <p style="margin-top: 8px; font-weight: bold; color: {{ primary_color|default('#5dade2') }};">Notes:</p>
                    <p>{{ consultation.notes }}</p>
                    {% endif %}
                </div>
                
                <div style="text-align: right; margin-top: 15px;">
                    <p style="border-top: 1px solid #34495e; width: 150px; margin-left: auto; padding-top: 3px; text-align: center; font-size: 7pt; color: #7f8c8d;">Doctor's Signature</p>
                </div>
            </td>
        </tr>
        
        <!-- FOOTER ROW -->
        <tr class="footer-row">
            <td colspan="2" class="footer-text">
                <p style="margin: 2px 0;">📞 {{ doctor.phone }} | ✉ medical@clinic.com | 📍 {{ doctor.address }}</p>
                {% if qr_base64 %}
                <img src="data:image/png;base64,{{ qr_base64 }}" class="classic-qr" alt="QR" />
                {% endif %}
            </td>
        </tr>
    </table>
    </div>
</body>
</html>
"""
