import { TipoUnidadMedida } from "src/common/enums/TipoUnidadMedida";
import { UnidadConversione } from "src/unidad-conversiones/entities/unidad-conversione.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class UnidadMedida {

    @PrimaryGeneratedColumn()
    id_unidadMedida: number;
    
    @Column({unique: true})
    nb_unidadMedida: string;

    @Column()
    abreviatura: string;

    // @Column('decimal', { precision: 10, scale: 6, nullable: true }, )
    // factor: number; // Cambiado a number para operaciones matemáticas

    @OneToMany(() => UnidadConversione, (conversion) => conversion.fromUnit)
    conversionsFrom: UnidadConversione[];
  
    @OneToMany(() => UnidadConversione, (conversion) => conversion.toUnit)
    conversionsTo: UnidadConversione[];

   
    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;

    @Column({type: 'enum', enum: TipoUnidadMedida, nullable: true})
    tipoUnidadMedida: TipoUnidadMedida;

    @Column({default: true, nullable: true, type: 'boolean'})
    estado: boolean;
}
