import { User } from 'models';
import { z } from 'zod';

const userSchema = z.object({
    name: z.string(),
    email: z.string(),
    address: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    regions: z.array(z.string()),
   });
export async function createNewUser(request: Request, response: Response) {
    try {
       const validatedData = userSchema.parse(request.body);
   
       const { name, email, address, coordinates, regions } = validatedData;
   
       const user = new User(name, email, address, coordinates, regions);
       await user.save();
   
       return response.status(201).json(user);
    } catch (error) {
       if (error instanceof z.ZodError) {
         return response.status(400).json({ message: 'solicitação inválida', errors: error.errors });
       } else {
         console.error('Error creating user:', error);
         return response.status(500).json({ message: 'Ocorreu um erro ao criar o usuário' });
       }
    }
}