import styles from "@/components/cables/cables.module.css"

/**
 * Tema "consola" para todas las vistas del módulo.
 *
 * Es un layout anidado, así que sigue adentro del Header/Footer del
 * sitio: el módulo se ve como una sección oscura deliberada dentro
 * de la página. Si en algún momento querés el desafío a pantalla
 * completa sin el chrome del sitio, hay que pasar el resto de las
 * páginas a un route group `app/(sitio)/` y darle a la sala de
 * escape su propio root layout.
 */
export default function CablesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={styles.consola}>{children}</div>
}
