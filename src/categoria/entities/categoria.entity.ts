import { Empresa } from "src/empresa/entities/empresa.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Categoria {
    @PrimaryGeneratedColumn()
    id_categoria: number;

    @Column()
    nombre: string;

    @Column({ default: 'Activo' })
    estado: string;


    @ManyToOne(() => Empresa, empresa => empresa.empleado)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

    @Column()
    userEmail: string;

}
