import React, { useEffect, useState } from "react";

export const Profile: React.FC = () => {
    interface MyInfo {
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        profile: {
            bio: string;
            picture_url: string;
            municipality: {
                name: string;
                department: { name: string };
            };
            cellphone_number: string;
        };
    }

    const [myInfo, setMyInfo] = useState<MyInfo | null>(null);

    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [cellphone, setCellphone] = useState("");
    const [department, setDepartment] = useState("");
    const [municipality, setMunicipality] = useState("");
    const [picture, setPicture] = useState("");

    useEffect(() => {
        fetch("http://localhost:8000/api/users/me/", {
            method: "GET",
            credentials: "include",
        })
            .then((r) => r.json())
            .then((data) => {
                const info = data.data;
                setMyInfo(info);
                setUsername(info.username || "");
                setBio(info.profile?.bio || "");
                setCellphone(info.profile?.cellphone_number || "");
                setDepartment(info.profile?.municipality?.department?.name || "");
                setMunicipality(info.profile?.municipality?.name || "");
                setPicture(info.profile?.picture_url || "");
            });
    }, []);

    // PATCH update profile
    const handleSave = async () => {
        const res = await fetch(`http://localhost:8000/api/users/${myInfo?.username}/profile/`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                first_name: username,
                bio: bio,
                cellphone_number: cellphone ? cellphone : null,
            }),
        });
        console.log(username, bio, cellphone);
        const data = await res.json();
        console.log("PATCH RESPONSE:", data);

        if (res.ok) {
            alert("Perfil actualizado correctamente ✔");
        } else {
            alert("Error al actualizar: " + data.message);
        }
    };


    return (

        <div className="w-full flex bg-gray-50 justify-center px-4">
            <div className="w-full mt-10 mb-10 max-w-3xl bg-white rounded-xl shadow-sm p-8">

                {/* Título principal */}
                <h1 className="text-[30px] font-[Outfit] font-bold text-neutral-900">
                    Editar perfil
                </h1>

                <p className="text-[16px] text-neutral-600 mt-2 font-[Inter]">
                    Actualiza tu información personal
                </p>

                {/* Foto */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Foto de perfil
                </h2>

                <div className="flex items-center gap-6 mt-4">
                    <div className="w-[120px] h-[120px] rounded-full overflow-hidden">
                        <img
                            src={picture || "/farmer.jpg"}
                            className="w-full h-full object-cover"
                            alt="Foto"
                        />
                    </div>

                    <button
                        className="border hidden border-neutral-200 hover:bg-gray-50 rounded-md h-10 px-4 text-primary-500 font-medium"
                    >
                        Cambiar foto
                    </button>
                </div>

                {/* Información personal */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Información personal
                </h2>

                {/* Nombre */}
                <div className="mt-4">
                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
                        Nombre de usuario
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                {/* Descripción */}
                <div className="mt-6">
                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
                        Descripción
                    </label>
                    <textarea
                        className="w-full h-[100px] mt-1 p-3 border border-neutral-300 rounded-md"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />

                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter] mt-4 block">
                        Teléfono
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
                        value={cellphone}
                        onChange={(e) => setCellphone(e.target.value)}
                    />
                </div>

                {/* Ubicación */}
                <div className="mt-4">
                    <label className="font-medium text-[14px] text-neutral-900">
                        Departamento
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    />

                    <label className="font-medium text-[14px] text-neutral-900 mt-3">
                        Municipio
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                    />
                </div>

                {/* Notificaciones */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Notificaciones
                </h2>

                <div className="mt-4 flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="peer appearance-none w-4 h-4 border border-neutral-400 rounded checked:bg-green-600 transition"
                        />
                        <span>Recibir alertas</span>
                    </label>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 mt-12">
                    <button
                        onClick={handleSave}
                        disabled={!myInfo}
                        className={`w-[129px] h-[40px] px-3 flex items-center justify-center rounded-md 
        ${!myInfo ? "bg-gray-300" : "bg-[#448502] hover:bg-[#3C7602]"} text-white`}
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
