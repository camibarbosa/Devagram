import type {NextApiRequest, NextApiResponse, NextApiHandler} from 'next';
import mongoose from 'mongoose';
import type {RespostaPadraoMsg} from '../types/RespostaPadraoMsg';

export const conectarMongoDB = (handler : NextApiHandler) => 
    async (req: NextApiRequest, res : NextApiResponse<RespostaPadraoMsg>) => {
        //verificar se o banco já está conectado, se estiver, seguir para o endpoint
        //ou próximo middleware
        if(mongoose.connections[0].readyState){
            return handler(req, res);
        }

        //conectando caso não esteja conectado
        //obter a variável de ambiente preenchida do env
        const {DB_CONEXAO_STRING} = process.env;

        //se a env estiver vazia, encerra o uso do sistema e avisa o programador
        if(!DB_CONEXAO_STRING){
            return res.status(500).json({erro : "ENV de configuração do banco de dados não informado"});
        }

        mongoose.connection.on('connected', () => console.log('Banco de dados conectado'));
        mongoose.connection.on('erro', error => console.log(`Ocorreu erro ao conectar no banco de dados: ${error}`));
        await mongoose.connect(DB_CONEXAO_STRING);

        //agora pode seguir para o endpoint, pois esta conectado no banco
        return handler(req, res);
       
  }