# 非严格LIS与二维方案

一维不下降序列允许相等。仍按长度保存最小末尾；遇到 `x`，要替换第一个严格大于它的末尾（`upper_bound`），这样相等的数才可以接在后面。严格递增则替换第一个大于等于它的末尾。

二维点链要求两个坐标都严格增大。先按 `x` 升序排，再对 `y` 求严格 LIS。容易错的是相同的 `x`：把这组的 `y` 倒序排，严格 LIS 就不可能从中取两个点。沿前驱还原后，返回原输入的下标。

a 为 `vector<i64>`，points 为 `vector<pair<i64,i64>>`，每项 {x,y}；值可负、可重复。 下标从 0 开始；一维下标递增，二维按坐标递增而非输入顺序；空输入返回空数组。

时间 O(n log n)，空间 O(n)。

```cpp
namespace SequenceExtra {
    // 返回一条最优一维子序列；strict=false 允许相邻值相等
    std::vector<int> lis(const std::vector<i64> &a, bool strict = true) {
        std::vector<i64> tails;
        std::vector<int> id, previous(a.size(), -1);
        for (int i = 0; i < int(a.size()); ++i) {
            int p = (strict ? std::lower_bound(tails.begin(), tails.end(), a[i])
                            : std::upper_bound(tails.begin(), tails.end(), a[i])) -
                    tails.begin();
            if (p)
                previous[i] = id[p - 1];
            if (p == int(tails.size())) {
                tails.push_back(a[i]);
                id.push_back(i);
            } else {
                tails[p] = a[i];
                id[p] = i;
            }
        }
        std::vector<int> answer;
        for (int i = id.empty() ? -1 : id.back(); i != -1; i = previous[i])
            answer.push_back(i);
        std::reverse(answer.begin(), answer.end());
        return answer;
    }
    // 返回 x 与 y 均严格递增的最长点链，输入下标 [0,points.size())
    std::vector<int> chain2D(const std::vector<std::pair<i64, i64>> &points) {
        std::vector<int> order(points.size());
        std::iota(order.begin(), order.end(), 0);
        std::sort(order.begin(), order.end(), [&](int i, int j) {
            if (points[i].first != points[j].first)
                return points[i].first < points[j].first;
            if (points[i].second != points[j].second)
                return points[i].second > points[j].second;
            return i < j;
        });
        std::vector<i64> y;
        for (int i : order)
            y.push_back(points[i].second);
        auto ids = lis(y);
        for (int &i : ids)
            i = order[i];
        return ids;
    }
}
```
