import { Query } from "mongoose";
import type {NextApiRequest, NextApiResponse} from "next";
import { conectarMongoDB } from "../../middlewares/conectarMongoDB";
import { validarTokenJWT } from "../../middlewares/validarTokenJWT";
import { SeguidorModel } from "../../models/SeguidoresModel";
import { UsuarioModel } from "../../models/UsuarioModel";
import type {RespostaPadraoMsg} from "../../types/RespostaPadraoMsg"

const endpointSeguir = async (req : NextApiRequest, res : NextApiResponse<RespostaPadraoMsg>) => {
    try {
        if(req.method === 'PUT'){
            const {userId, id} = req?.query;
            //usuario logado/autenticado = quem esta fazendo as ações
            const usuarioLogado = await UsuarioModel.findById(userId);
            if(!usuarioLogado){
                return res.status(400).json({erro : 'Usuário logado não encontrado'})
            }

            //id do usuario a ser seguido - query
            const usuarioASerSeguido = await UsuarioModel.findById(id);
            if(!usuarioASerSeguido){
                return res.status(400).json({erro : 'Usuário a ser seguido não encontrado'})
            }

            //buscar se eu logado sigo ou não esse usuario
            const euJaSigoEsseUsuario = await SeguidorModel.find({usuarioId : usuarioLogado._id, usuarioSeguidoId : usuarioASerSeguido._id});
            if(euJaSigoEsseUsuario && euJaSigoEsseUsuario.length > 0){
                //usuario ja seguido
                euJaSigoEsseUsuario.forEach(async(e : any) => 
                await SeguidorModel.findOneAndDelete({_id :  e._id}));
                usuarioLogado.seguindo--;
                await UsuarioModel.findByIdAndUpdate({_id : usuarioLogado._id}, usuarioLogado);
                usuarioASerSeguido.seguidores--;
                await UsuarioModel.findByIdAndUpdate({_id : usuarioASerSeguido._id}, usuarioASerSeguido);

                return res.status(200).json({msg : 'Deixou de seguir o usuário com sucesso'});

            } else {
                //usuario não seguido
                const seguidor = {
                    usuarioId : usuarioLogado._id,
                    usuarioSeguidoId : usuarioASerSeguido._id
                };

                await SeguidorModel.create(seguidor);

                //adicionar um seguindo no usuario logado
                //logo, o numero de seguindo dele tem que aumentar
                usuarioLogado.seguindo++;
                //atualizando no bd
                await UsuarioModel.findOneAndUpdate({_id : usuarioLogado._id}, usuarioLogado);

                //adicionar um seguidor no usuario seguido
                //portanto, o numero de seguidores dele tem que aumentar
                usuarioASerSeguido.seguidores++;
                await UsuarioModel.findByIdAndUpdate({_id : usuarioASerSeguido._id}, usuarioASerSeguido);

                return res.status(200).json({msg : 'Usuário seguido com sucesso'});
            }
        }
        return res.status(405).json({erro : 'Método informado não existe'});
    } catch(e){
        console.log(e);
        return res.status(500).json({erro : 'Não foi possível seguir usuário informado'});
    }
}

export default validarTokenJWT(conectarMongoDB(endpointSeguir));