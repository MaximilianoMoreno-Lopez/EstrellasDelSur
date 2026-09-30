# CHEMSAFE (ESC30-SOL, FR02, ronda 3 de octubre de 2026)

Segundo proyecto redactado con este método y primero en francés y para una agencia extranjera. Solicita Étoiles de France (París, red Estrellas de Europa) en nombre de cinco jóvenes. Material en `proyectos/cuerpo_europeo_solidaridad/ESC30_ChemSafe_Etoiles/`.

## Punto de partida
La ronda 1 de 2026 ("ChemSafe Jeunes", 100 % en línea) se rechazó con 57 puntos: relevancia 18/40, diseño 26/40, gestión 13/20. La carta de la agencia (20 de mayo de 2026) reprochó: necesidades sin datos ni metodología, vínculo estructura-público sin explicar, socios sin nombrar, poca voz de los jóvenes (parecía proyecto de la asociación), dispositivo 100 % digital sin justificar, sin coach pese al tema, capacidad de gestión no documentada, evaluación poco integrada en el pilotaje, difusión sin actores nombrados. El borrador de ronda 3 que llegó por correo ya era presencial y con coach, pero sonaba a IA (dos puntos y guiones largos), a organización, sin fuentes, con un campo cortado a 5.000 y con las actividades pegadas por error en la respuesta francesa de resultados.

## Qué se hizo
1. Perfil ESC30 cerrado de verdad: Guía 2026 parte B y Guide for Experts 2026 extraídos con pypdf y destilados en `perfiles/rubricas/esc30-sol.md`.
2. Workflow de investigación con 4 frentes (epidemiología, servicios de París, marco jurídico y de RdR, agencia FR02) y un verificador por dato que releyó cada URL: 60 de 63 datos confirmados. De ahí salieron las cifras con fuente (rapport Benyamina 2022, BEH de Santé publique France 2026, OFDT 2024, ERAS 2023, DRAMES vía Sénat 2026, INJEP/ENVIE, Ifop 2026), la cartografía real de servicios (guide de poche Chemsex de la Ville de Paris) y dos reglas de la agencia francesa que no están en la guía europea: la actividad no puede ser el cœur de métier de la estructura y el proyecto tiene que experimentar algo nuevo.
3. Biblia con voz de los jóvenes, cinco perfiles con motivación personal, nueve estructuras nombradas con estado de contacto, eje diferencial (boîte à questions anonymes que dicta el contenido y relais CHEMSAFE que coaniman), indicadores con umbrales de pilotaje.
4. 12 redactores en paralelo, 4 verificadores (coherencia, rúbrica y carta, estilo y voz, francés y longitudes) que sacaron 77 issues, 21 decisiones transversales, 12 correctores, comprobación mecánica y una pasada final con 3 lectores frescos.

## Qué funcionó
- Leer la carta de la agencia como rúbrica adicional. Cada reproche se convirtió en un elemento a verificar y el verificador de rúbrica lo recorrió punto por punto.
- El fichero de datos con fuente verificada evitó cifras inventadas y dio al texto la concreción que pedía la agencia.
- Fijar la voz en la biblia ("nous" son los cinco, la asociación en tercera persona) antes de redactar. Aun así, hizo falta corregir once frases-anuncio del tipo "La règle est simple".

## Qué costó
- Los redactores contaron la misma anécdota fundacional con dos versiones distintas en dos bloques, y repitieron íntegros el diagnóstico, el protocolo de orientación y el reparto "la asociación administra" en cuatro o seis bloques. La regla nueva: cada argumento se cuenta entero en UN bloque y en el resto se remite.
- Tres bloques afirmaron "première candidature au Corps", verificablemente falso porque la agencia tiene la ronda 1 registrada. Regla nueva: "primer proyecto" sí, "primera candidatura" nunca.
- El script del workflow de corrección se rompió por un apóstrofo francés dentro de comillas simples y luego por los \r\n que dejó Python al reescribirlo. Usar backticks para cadenas con francés y `newline='\n'` al escribir.
- Un campo "triple" (sostenibilidad, accesibilidad y digital) con tope de 5.000: hay que repartir y medir.

## Reglas que nacieron aquí
- Voz de los jóvenes, cada argumento en un solo bloque, estructuras con estado de contacto y verbos de intención, datos con fuente nombrada en la frase, control de edad expreso cuando el tema es drogas y sexo y los espacios reciben menores, y las dos reglas de la agencia francesa (cœur de métier y experimentar). Todas en `perfiles/esc30-sol.md`.
