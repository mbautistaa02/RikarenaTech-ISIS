interface AlertCardProps {
  title: string;
  description: string;
  image?: string;
}

function AlertCard({ title, description, image }: AlertCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-red-100">
      <h2 className="text-[20px] font-bold font-[Outfit] text-neutral-900 mb-2">
        {title}
      </h2>
      <p className="text-neutral-700 font-[Inter] text-sm leading-relaxed mb-4">
        {description}
      </p>

      {image && (
        <img
          src={image}
          alt="alert"
          className="w-full h-40 object-cover rounded-md mt-2"
        />
      )}
    </div>
  );
}

export default function Alerts() {
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-14 py-10">
      <h1 className="text-center text-[32px] font-bold text-neutral-900 mb-10">
        Alertas
      </h1>

      {/* GRID DE ALERTAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <AlertCard
          title="¡Alerta, lluvias en la zona!"
          description={`Se han presentado lluvias en tu ciudad Duitama, Boyacá.  
Te recomendamos cuidar tus cultivos.`}
          image="https://www.elcampesino.co/wp-content/uploads/2015/06/IMG_4778.jpg"
        />

        <AlertCard
          title="¡Alerta, sequías en la zona!"
          description={`Se han presentado sequías en Pitalito, Huila. Te recomendamos cuidar tus cultivos."
          image="https://www.elcampesino.co/wp-content/uploads/2015/06/IMG_4778.jpg"`}
        />

        <AlertCard
          title="¡Alerta, mantenimiento de la aplicación!"
          description={`Hoy 01 de diciembre estaremos en mantenimiento entre las 20h y 21h. Gracias por tu comprensión.`}
        />

        <AlertCard
          title="¡Alerta, nuevo producto!"
          description={`La uchuva es ahora uno de nuestros nuevos productos. Ya puedes comprarla en nuestra tienda.`}
          image="https://cdn.pixabay.com/photo/2017/04/05/20/37/uchuva-2207406_960_720.jpg"
        />

        <AlertCard
          title="¡Alerta, producto en temporada!"
          description={`La papa está en temporada. Puedes encontrarla a excelente precio en nuestra tienda.`}
          image="https://cdn.pixabay.com/photo/2014/04/10/11/17/potatoes-320041_960_720.jpg"
        />

        <AlertCard
          title="¡Alerta, mantenimiento mañana!"
          description="Mañana 02 de diciembre habrá mantenimiento de 20h a 21h."
        />
      </div>
    </div>
  );
}
