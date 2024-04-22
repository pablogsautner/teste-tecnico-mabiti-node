import express from 'express';
import { UserModel } from './models';
import { env } from './env/index.env';

export const server = express();
const router = express.Router();

export const STATUS = {
  OK: 200,
  CREATED: 201,
  UPDATED: 201,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  DEFAULT_ERROR: 418,
};


router.get('/user', async (req: Request, res: Response) => {
  try {
     const users = await UserModel.find({});
 
     return res.status(200).json(users);
  } catch (error) {
     console.error('Error fetching users:', error);
     return res.status(500).json({ message: 'Error fetching users' });
  }
 });

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  const user = await UserModel.findOne({ _id: id });

  if (!user) {
    return res.status(STATUS.NOT_FOUND).json({ message: 'User not found' });
  }

  return res.json(user);
});

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { update } = req.body;

  const user = await UserModel.findOne({ _id: id });

  if (!user) {
    return res.status(STATUS.NOT_FOUND).json({ message: 'User not found' });
  }

  user.name = update.name;

  await user.save();

  return res.sendStatus(STATUS.UPDATED);
});

router.post('/user', async (req, res) => {
  const data = req.body;
  
  if (!data.name || !data.email || !data.address || !data.coordinates || !data.regions) {
      return res.status(STATUS.BAD_REQUEST).json({ message: 'Campos obrigatórios ausentes' });
  }
  
  try {
      const user = new UserModel({
        name: data.name,
        email: data.email,
        address: data.address,
        coordinates: data.coordinates,
        regions: data.regions,
      });
  
      await user.save();
  
      return res.status(STATUS.CREATED).json(user);
  } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Ocorreu um erro ao criar o usuário' });
  }
 });
 
server.use(express.json());
server.use(router);

server.listen(env.PORT, () => {
  console.log(`O servidor está rodando na porta ${env.PORT}`);
});