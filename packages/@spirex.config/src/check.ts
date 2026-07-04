import { configBuilder, InMemoryConfigProvider } from "./index";

const config = configBuilder()
    .add(new InMemoryConfigProvider({
        key: "value",
    }))
    .build()

config.
