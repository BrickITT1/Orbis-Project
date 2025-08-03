
import React from "react";
import { SectionLayout } from "../../components/Layout/SectionLayout";
import { TitleSection } from "../../components/UI/TitleSection";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, SubmitButton } from "./FormField";

interface SupportFormData {
    name: string;
    email: string;
    description: string;
}


export const Support = () => {
    const {
            register,
            handleSubmit,
            formState: { errors },
    } = useForm<SupportFormData>();

    const onSubmit: SubmitHandler<SupportFormData> = async (data) => {
        try {
            console.log(data)
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div className="bg-[rgba(27,30,75,0.3)]" id="support">
            <SectionLayout classListContainer="gap-10 lg:!max-w-2xl">
                <div className="flex flex-col gap-5">
                    <TitleSection>ПОДДЕРЖКА</TitleSection>
                    <p className="text-2xl text-center">Здесь вы можете обратиться за помощью по любому интересующему вас вопросу</p>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} {...register} className="flex flex-col gap-10 items-center">
                    <InputField<SupportFormData>
                        type="text"
                        placeholder="Иван"
                        name="name"
                        register={register}
                        error={errors.name}
                        validation={{ required: "Required" }}
                        label="Имя"
                    />
                    <InputField<SupportFormData>
                        type="text"
                        placeholder="Ivan@example.net"
                        name="email"
                        register={register}
                        error={errors.email}
                        validation={{ required: "Required" }}
                        label="Почта"
                    />
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-2xl">Описание проблемы</label>
                        <textarea
                            placeholder={"Я хочу спросить о...."}
                            className="border-2 p-2 border-white -m-2 w-full box-border outline-none text-3xl"
                        {...register("description", { required: "Required" })}
                        ></textarea>
                    {errors.description && <div>{errors.description.message}</div>}
                    </div>
                    
                    <SubmitButton label="Отправить" />
                    
                </form>
            </SectionLayout>
        </div>
    )
}