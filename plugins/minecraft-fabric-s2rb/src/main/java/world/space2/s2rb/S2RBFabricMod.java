package world.space2.s2rb;

public final class S2RBFabricMod {
    public static final String WORLD_SUNS = "GAME-NE-004-MINECRAFT2-001-2";
    public static final double CONTAINER_VOLUME_M3 = 9.6; // 2.0 blocks x 2.0 blocks x 2.4 blocks
    public static final boolean ALLOW_CURRENCY_IMPORT = false;

    public static double[] s2MetersToMinecraftBlocks(double x, double y, double z) {
        // 1 Minecraft block = 1.0 meter; Right-Handed +Y Up
        return new double[] { x, z, -y };
    }
}
