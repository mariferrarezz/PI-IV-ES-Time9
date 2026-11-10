import mongoose, { Types } from "mongoose";

export interface UsuariosRepository {
  buscarPorFirebaseUid(uid: string): Promise<{ _id: Types.ObjectId } | null>;
}

// Leitura mínima do perfil existente. Não cadastra nem modifica usuários.
export const usuariosRepository: UsuariosRepository = {
  async buscarPorFirebaseUid(uid) {
    const perfil = await mongoose.connection.collection("usuarios").findOne(
      { firebaseUid: uid }, { projection: { _id: 1 } },
    );
    return perfil ? { _id: new Types.ObjectId(String(perfil._id)) } : null;
  },
};
