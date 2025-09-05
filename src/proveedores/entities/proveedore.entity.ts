import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';


@Entity()
export class Proveedore {
    @PrimaryGeneratedColumn()
    id_proveedor: number;

    @Column()
    nb_proveedor: string;
    
    @Column()
    correoProveedor: string;
    
    @Column()
    tel_proveedor: string;
    
    @Column()
    rfc_proveedor: string;
    
    @Column()
    nb_comercial: string;
    
    @Column()
    codigoPostal: string;

    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;


    @ManyToOne(() => Empresa, empresa => empresa.empleado)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

}
