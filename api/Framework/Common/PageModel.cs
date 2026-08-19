namespace Framework.Common;

public class PageModel
{
    public int PageIndex { get; set; } = 1;

    private int pageSize = 10;

    public int PageSize
    {
        get => pageSize;
        set => pageSize = value <= 0 ? 10 : value;
    }

    private int recordCount;

    public int RecordCount
    {
        get => recordCount;
        set => recordCount = value;
    }

    public int PageCount
    {
        get
        {
            if (PageSize == 0)
                pageSize = 10;

            return RecordCount % pageSize == 0
                ? RecordCount / pageSize
                : RecordCount / pageSize + 1;
        }
    }
}
