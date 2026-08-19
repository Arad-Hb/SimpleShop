using Framework.Common.Constants;

namespace SimpleShop.Tests;

public class OrderStatusCodesTests
{
    [Fact]
    public void CustomerCanCancel_OnlyPending()
    {
        Assert.True(OrderStatusCodes.CustomerCanCancel("pending"));
        Assert.False(OrderStatusCodes.CustomerCanCancel("processing"));
        Assert.False(OrderStatusCodes.CustomerCanCancel("shipped"));
    }

    [Fact]
    public void AdminCanCancel_PendingOrProcessing()
    {
        Assert.True(OrderStatusCodes.AdminCanCancel("pending"));
        Assert.True(OrderStatusCodes.AdminCanCancel("processing"));
        Assert.False(OrderStatusCodes.AdminCanCancel("shipped"));
        Assert.False(OrderStatusCodes.AdminCanCancel("delivered"));
    }

    [Fact]
    public void CanTransition_ForwardPath()
    {
        Assert.True(OrderStatusCodes.CanTransition("pending", "processing"));
        Assert.True(OrderStatusCodes.CanTransition("processing", "shipped"));
        Assert.True(OrderStatusCodes.CanTransition("shipped", "delivered"));
        Assert.False(OrderStatusCodes.CanTransition("delivered", "pending"));
        Assert.False(OrderStatusCodes.CanTransition("shipped", "cancelled"));
    }
}
