#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "S2RBSubsystem.generated.h"

UCLASS()
class S2RBUNREAL_API US2RBSubsystem : public UGameInstanceSubsystem {
    GENERATED_BODY()
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // Converts S2 Canonical (+X Right, +Y Fwd, +Z Up, meters) to UE5 (+X Fwd, +Y Right, +Z Up, cm)
    UFUNCTION(BlueprintPure, Category = "S2RB|Coordinates")
    static FVector S2MetersToUnrealCm(const FVector& S2Meters, float AvatarScale = 1.0f);

    // Dispatches @dOmega boundary-crossing projectile or annular ground AoE into Niagara
    UFUNCTION(BlueprintCallable, Category = "S2RB|HybridRender")
    void DispatchBoundaryExitToNiagara(const FString& S2Did, const FVector& ExitPosCm, const FVector& ExitVelCmPerSec);
};
