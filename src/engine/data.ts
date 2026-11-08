import type { Party, Proposal, Topic, TopicId, WorldItem } from './types'

/**
 * BANCO DE AFIRMACIONES PARA SITUARSE EN EL ESPECTRO IZQUIERDA–DERECHA.
 *
 * Base: la escala de autoubicación ideológica del CIS (1 = izquierda, 10 = derecha), aquí 0–10,
 * y las dos dimensiones que usa la ciencia política europea (Chapel Hill Expert Survey):
 *  · eje económico ('eco'): más Estado y redistribución ↔ más mercado, menos impuestos y menos gasto.
 *  · eje social y cultural ('cul'): libertades, diversidad e integración ↔ orden, tradición e identidad nacional.
 * Los polos siguen las definiciones académicas de izquierda radical (March y Mudde: anticapitalismo,
 * igualdad económica, internacionalismo) y derecha radical (Mudde: nativismo, autoritarismo, populismo).
 * Solo posiciones que se defienden dentro de la democracia: nada de violencia ni de ataques a personas.
 *
 * Cada afirmación tiene una posición (pos). La tendencia "típica" se deduce de esa posición.
 * Redacción en lenguaje sencillo, sin siglas ni nombres de partidos.
 */
export const PARTIES: Party[] = [
  { id: 'ei', name: 'Extrema izquierda', short: 'Extrema izquierda', color: '#dc2626', glyph: 'EI', pos: 1,
    about: 'Cambiar el sistema económico: mucho más Estado, propiedad pública y reparto de la riqueza.' },
  { id: 'ci', name: 'Centro izquierda', short: 'Centro izquierda', color: '#f472b6', glyph: 'CI', pos: 3.25,
    about: 'Economía de mercado con un Estado fuerte: servicios públicos, impuestos progresivos y derechos sociales.' },
  { id: 'c', name: 'Centro', short: 'Centro', color: '#a78bfa', glyph: 'C', pos: 5,
    about: 'Pragmatismo y acuerdos: mezclar mercado y Estado según lo que funcione, sin bandos fijos.' },
  { id: 'cd', name: 'Centro derecha', short: 'Centro derecha', color: '#38bdf8', glyph: 'CD', pos: 6.75,
    about: 'Mercado libre, menos impuestos y burocracia, familia, orden y unidad nacional.' },
  { id: 'ed', name: 'Extrema derecha', short: 'Extrema derecha', color: '#16a34a', glyph: 'ED', pos: 9,
    about: 'Nación primero: freno fuerte a la inmigración, mano dura, tradición y menos poder para Europa.' },
]

export const TOPICS: Topic[] = [
  { id: 'economia', name: 'Economía y clima', emoji: '🏭', color: '#eab308' },
  { id: 'impuestos', name: 'Impuestos', emoji: '💶', color: '#f59e0b' },
  { id: 'servicios', name: 'Sanidad, colegios y casa', emoji: '🏥', color: '#ef4444' },
  { id: 'trabajo', name: 'Trabajo', emoji: '💼', color: '#0ea5e9' },
  { id: 'inmigracion', name: 'Inmigración', emoji: '🌍', color: '#f43f5e' },
  { id: 'seguridad', name: 'Orden y seguridad', emoji: '🚔', color: '#64748b' },
  { id: 'valores', name: 'Familia y valores', emoji: '👨‍👩‍👧', color: '#14b8a6' },
  { id: 'pais', name: 'España y el mundo', emoji: '🇪🇺', color: '#8b5cf6' },
]

// [posición 0-10, eje, idea, explicación, dibujo en "tu país"]
type Row = [number, 'eco' | 'cul', string, string, WorldItem]

const RAW: Record<TopicId, Row[]> = {
  economia: [
    [0.8, 'eco', 'Que los bancos y las compañías de la luz sean del Estado', 'Pasarían a ser públicos para que no busquen beneficio.', 'torre'],
    [1.0, 'eco', 'Que los trabajadores sean los dueños de las grandes empresas', 'Las empresas se gestionarían entre todos sus empleados.', 'fabrica'],
    [0.9, 'cul', 'Producir y consumir menos para salvar el planeta', 'Aunque la economía deje de crecer.', 'arbol'],
    [3.2, 'eco', 'Que el Gobierno intervenga para frenar la subida de precios', 'Por ejemplo, con topes o ayudas en la luz y la comida.', 'moneda'],
    [3.5, 'eco', 'Una compañía de la luz pública que compita con las privadas', 'Las privadas seguirían existiendo.', 'panel'],
    [3.2, 'cul', 'Dejar de vender coches de gasolina y diésel en 2035', 'Para reducir la contaminación.', 'farola'],
    [5.0, 'eco', 'Mezclar mercado libre y ayudas públicas según lo que funcione', 'Sin ideas fijas: cada caso, con datos.', 'moneda'],
    [5.0, 'eco', 'Que los grandes partidos pacten juntos las reformas económicas', 'Para que no cambien con cada Gobierno.', 'torre'],
    [5.2, 'cul', 'Combatir el cambio climático poco a poco y sin dañar empleos', 'Ir cambiando de energía a un ritmo que la industria aguante.', 'molino'],
    [6.6, 'eco', 'Menos papeleo para abrir y hacer crecer un negocio', 'Quitar normas y permisos que frenan a las empresas.', 'grua'],
    [7.0, 'eco', 'Vender las empresas públicas que pierden dinero', 'Pasarían a manos privadas para que el Estado no gaste en ellas.', 'fabrica'],
    [6.8, 'cul', 'Mantener abiertas las centrales nucleares', 'Para tener luz más barata y segura.', 'fabrica'],
    [8.8, 'eco', 'Las empresas españolas, primero en los contratos públicos', 'Aunque una extranjera ofrezca un precio mejor.', 'fabrica'],
    [9.0, 'eco', 'Cerrar muchos ministerios y organismos públicos', 'Un Estado mucho más pequeño.', 'torre'],
    [8.8, 'cul', 'Quitar las leyes contra el cambio climático', 'Porque encarecen la vida y frenan al campo y la industria.', 'fabrica'],
  ],
  impuestos: [
    [1.2, 'eco', 'Un impuesto muy alto a las grandes fortunas', 'Para repartir la riqueza: lo de los más ricos, a servicios para todos.', 'moneda'],
    [1.0, 'eco', 'Poner por ley un sueldo máximo', 'Nadie podría ganar más de cierta cantidad.', 'moneda'],
    [3.0, 'eco', 'Que paguen más impuestos los que más ganan', 'Más porcentaje cuanto más alto es el sueldo.', 'moneda'],
    [3.4, 'eco', 'Más impuestos a la banca y las grandes empresas', 'Para pagar la sanidad, los colegios y las pensiones.', 'torre'],
    [5.0, 'eco', 'Dejar los impuestos como están y perseguir más el fraude', 'Que paguen todos lo que deben antes de subir o bajar nada.', 'moneda'],
    [4.8, 'eco', 'Bajar impuestos solo si no hay que recortar servicios', 'Primero asegurar la sanidad y la educación.', 'moneda'],
    [6.4, 'eco', 'Bajar el impuesto sobre el sueldo a la clase media', 'Que a la gente le quede más dinero cada mes.', 'moneda'],
    [7.0, 'eco', 'Que heredar no pague impuestos', 'Quitar el impuesto de sucesiones en toda España.', 'casa'],
    [8.8, 'eco', 'Un único porcentaje de impuesto, muy bajo, para todos', 'Pague igual en porcentaje quien gane poco y quien gane mucho.', 'moneda'],
    [8.6, 'eco', 'No dar dinero público a partidos, sindicatos ni asociaciones', 'Que se financien solo con sus socios.', 'torre'],
  ],
  servicios: [
    [1.2, 'eco', 'Que toda la sanidad y la educación sean públicas', 'Sin dinero público para clínicas ni colegios privados.', 'hospital'],
    [0.9, 'eco', 'Quitar sus pisos vacíos a los grandes propietarios', 'El Estado los alquilaría barato como vivienda social.', 'casa'],
    [3.2, 'eco', 'Más dinero para la sanidad pública aunque suban los impuestos', 'Más médicos y menos listas de espera.', 'hospital'],
    [3.0, 'eco', 'Poner un precio máximo al alquiler en las zonas más caras', 'Para que vivir de alquiler sea posible.', 'casa'],
    [5.2, 'eco', 'Usar clínicas privadas solo si hay listas de espera muy largas', 'Pagado por la sanidad pública y como excepción.', 'hospital'],
    [4.8, 'eco', 'Ayudas a los jóvenes para su primera casa, alquilada o comprada', 'Que cada uno elija lo que le conviene.', 'casa'],
    [6.8, 'eco', 'Que las familias elijan colegio con ayuda pública', 'Público o concertado: el dinero sigue al alumno.', 'escuela'],
    [6.5, 'eco', 'Construir muchas más casas quitando trabas para edificar', 'Más oferta para que bajen los precios.', 'grua'],
    [9.0, 'cul', 'Que los españoles tengan preferencia en la vivienda pública', 'Antes que los extranjeros, aunque estos vivan aquí legalmente.', 'casa'],
    [8.8, 'cul', 'Sanidad gratis solo para quien tiene papeles y ha cotizado', 'A los demás, solo urgencias.', 'hospital'],
  ],
  trabajo: [
    [1.3, 'eco', 'Trabajar 30 horas a la semana cobrando lo mismo', 'Una gran bajada de la jornada.', 'fabrica'],
    [0.9, 'eco', 'Prohibir despedir en empresas que ganan dinero', 'Si hay beneficios, no se puede echar a nadie.', 'fabrica'],
    [3.0, 'eco', 'Subir el sueldo mínimo cada año', 'Que nunca pierda frente a los precios.', 'moneda'],
    [3.4, 'eco', 'Que los sindicatos tengan más fuerza para negociar sueldos', 'Convenios que protejan a los trabajadores.', 'torre'],
    [5.0, 'eco', 'Cursos gratis para cambiar de trabajo', 'Cuando la tecnología elimina empleos, formar en vez de dar solo un subsidio.', 'escuela'],
    [5.0, 'eco', 'Que empresas y sindicatos pacten antes de cambiar las leyes', 'Diálogo antes que imponer.', 'torre'],
    [6.8, 'eco', 'Que contratar le cueste menos a las empresas', 'Menos cotizaciones para crear más empleo.', 'fabrica'],
    [6.4, 'eco', 'Bajar mucho lo que pagan los autónomos cada mes', 'Para que trabajar por tu cuenta compense.', 'moneda'],
    [9.2, 'cul', 'Que los trabajos se den primero a los españoles', 'Antes que a los extranjeros que viven aquí.', 'fabrica'],
    [8.4, 'eco', 'Quitar el paro a quien rechace una oferta de trabajo', 'Una sola negativa bastaría.', 'moneda'],
  ],
  inmigracion: [
    [0.6, 'cul', 'Fronteras abiertas: que cualquiera pueda venir a vivir aquí', 'Sin necesidad de visado ni de contrato.', 'tren'],
    [1.4, 'cul', 'Que los inmigrantes puedan votar en todas las elecciones', 'Aunque no tengan la nacionalidad.', 'torre'],
    [3.0, 'cul', 'Dar papeles a los inmigrantes que ya viven y trabajan aquí', 'Para que coticen y tengan derechos.', 'casa'],
    [3.6, 'cul', 'Más ayudas para que los inmigrantes se integren', 'Clases de idioma, ayuda para encontrar trabajo y casa.', 'escuela'],
    [5.2, 'cul', 'Que vengan los inmigrantes que necesitan las empresas', 'Con contrato desde su país, según los trabajos que falten.', 'tren'],
    [4.8, 'cul', 'Que toda Europa se reparta la acogida de inmigrantes', 'Que no recaiga solo en los países del sur.', 'torre'],
    [7.0, 'cul', 'Más control en la frontera y devolver a quien entre sin permiso', 'Con acuerdos con los países de origen.', 'torre'],
    [6.6, 'cul', 'Pedir hablar bien español para dar la nacionalidad', 'Y un examen sobre la vida y las leyes en España.', 'escuela'],
    [9.0, 'cul', 'Expulsar a todos los inmigrantes que estén sin papeles', 'Aunque lleven años viviendo aquí.', 'torre'],
    [9.6, 'cul', 'Frenar casi del todo la inmigración', 'Para proteger la identidad del país: que entre muy poca gente de fuera.', 'torre'],
  ],
  seguridad: [
    [1.4, 'cul', 'Quitar la ley que limita las protestas en la calle', 'Más libertad para manifestarse sin multas.', 'farola'],
    [1.2, 'cul', 'Que la Guardia Civil deje de ser un cuerpo militar', 'Que sea una policía civil más.', 'torre'],
    [3.2, 'cul', 'Prevenir el delito con educación y empleo, más que con castigos', 'Atacar las causas.', 'escuela'],
    [3.6, 'cul', 'Prohibir que la policía use pelotas de goma', 'Y que los agentes lleven cámara y número visible.', 'torre'],
    [5.0, 'cul', 'Más policía de barrio, cerca de los vecinos', 'Agentes que conozcan la zona.', 'farola'],
    [5.6, 'cul', 'Castigos más duros para quien comete delitos una y otra vez', 'Para los reincidentes.', 'torre'],
    [6.8, 'cul', 'Cadena perpetua revisable para los delitos más graves', 'Y que se aplique a más delitos.', 'torre'],
    [6.6, 'cul', 'Echar a los okupas en 48 horas', 'Que el dueño recupere su casa rápido.', 'casa'],
    [8.8, 'cul', 'Cárceles de máxima seguridad con trabajo obligatorio', 'Mano dura con los delincuentes peligrosos.', 'torre'],
    [9.0, 'cul', 'Poder juzgar a niños desde los 12 años', 'Hoy se hace desde los 14.', 'torre'],
  ],
  valores: [
    [1.4, 'cul', 'Quitar a la Iglesia sus ventajas fiscales y sus acuerdos', 'Un Estado totalmente laico.', 'torre'],
    [1.8, 'cul', 'Que cambiar de sexo en los papeles sea libre, con solo pedirlo', 'Sin informes médicos.', 'torre'],
    [3.0, 'cul', 'Que el aborto esté garantizado en los hospitales públicos', 'En toda España.', 'hospital'],
    [3.4, 'cul', 'Educación sexual obligatoria en los colegios', 'Desde pequeños y adaptada a cada edad.', 'escuela'],
    [5.4, 'cul', 'Que la política no se meta en los valores de cada familia', 'El colegio enseña y la familia educa.', 'casa'],
    [4.6, 'cul', 'Respetar todas las formas de familia, sin privilegios', 'Cada uno vive como quiere.', 'casa'],
    [6.4, 'cul', 'Muchas más ayudas a las familias que tengan hijos', 'Para que nazcan más niños.', 'casa'],
    [7.2, 'cul', 'Permiso de los padres para las charlas de sexualidad', 'Sin permiso, el niño no asiste.', 'escuela'],
    [9.2, 'cul', 'Prohibir el aborto', 'Salvo casos muy excepcionales.', 'hospital'],
    [9.4, 'cul', 'Que la ley solo llame familia a la de un hombre y una mujer', 'Y quitar el matrimonio entre personas del mismo sexo.', 'casa'],
  ],
  pais: [
    [1.4, 'cul', 'Que España sea una república y quitar la monarquía', 'Elegir al jefe del Estado por votación.', 'torre'],
    [1.0, 'cul', 'Salir de la OTAN', 'Y cerrar las bases militares extranjeras.', 'torre'],
    [2.8, 'cul', 'Reconocer que dentro de España hay varias naciones', 'Como Cataluña, el País Vasco o Galicia.', 'torre'],
    [3.4, 'cul', 'Que las comunidades que lo pidan tengan más autogobierno', 'Más poder para decidir sus propios asuntos.', 'casa'],
    [5.2, 'cul', 'Seguir en la Unión Europea y en la OTAN como hasta ahora', 'Sin grandes cambios.', 'torre'],
    [5.0, 'cul', 'Mantener el poder que tienen hoy las comunidades autónomas', 'Ni más ni menos autonomía.', 'casa'],
    [7.0, 'cul', 'Que el Gobierno central recupere poderes como la educación', 'Lo mismo en todas las comunidades.', 'escuela'],
    [6.6, 'cul', 'Defender la unidad de España frente a los independentistas', 'Ningún referéndum para separarse.', 'torre'],
    [9.2, 'cul', 'Quitar las comunidades autónomas', 'Que todo se decida desde el Gobierno central.', 'torre'],
    [9.0, 'cul', 'Quitar poder a Europa aunque haya que plantear salir de la UE', 'Que España decida sola sus leyes, sin depender de Bruselas.', 'torre'],
  ],
}

/** La tendencia a la que pertenece una posición de la escala */
export const tendencyOf = (pos: number) =>
  pos < 2.2 ? 'ei' : pos < 4.15 ? 'ci' : pos < 5.9 ? 'c' : pos < 7.9 ? 'cd' : 'ed'

export const PROPOSALS: Proposal[] = (Object.keys(RAW) as TopicId[]).flatMap((topic) =>
  RAW[topic].map(([pos, dim, title, detail, world], k) => ({
    id: `${topic}-${k + 1}`, partyId: tendencyOf(pos), topic, title, detail, world, pos, dim,
  })))

export const DATA_DATE = '8 de noviembre de 2026'

export const partyById = (id: string) => PARTIES.find((p) => p.id === id)!
export const topicById = (id: TopicId) => TOPICS.find((t) => t.id === id)!
export const proposalById = (id: string) => PROPOSALS.find((p) => p.id === id)!
