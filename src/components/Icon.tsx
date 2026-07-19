import MatComIcon from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof MatComIcon>, "name"> & {
  name: string;
};

export default function Icon({ name, ...rest }: Props) {
  return <MatComIcon name={name as any} {...rest} />;
}
