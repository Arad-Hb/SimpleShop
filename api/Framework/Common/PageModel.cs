namespace Framework.Common;

public class PageModel
{
    public int PageIndex { get; set; }

    private int _pageSize = 10;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value <= 0 ? 10 : value;
    }

    public int RecordCount { get; set; }

    public int PageCount
    {
        get
        {
            if (PageSize == 0) _pageSize = 10;
            return RecordCount % PageSize == 0
                ? RecordCount / PageSize
                : RecordCount / PageSize + 1;
        }
    }
}
